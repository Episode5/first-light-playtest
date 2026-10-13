import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {rollup} from '@rollup/wasm-node';
import {JSDOM,VirtualConsole} from 'jsdom';
import {PACK} from '../active-pack.mjs';
import {freshSave,serializeSave} from '../save.mjs';

const bundle=await rollup({input:fileURLToPath(new URL('../app.mjs',import.meta.url))});
const {output}=await bundle.generate({format:'iife'});await bundle.close();
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const saveKey=PACK.savePrefix+PACK.GRAPH_VERSION;
const tick=()=>new Promise(resolve=>setImmediate(resolve));

function browser(state,setup=()=>{}) {
  const errors=[];
  const virtualConsole=new VirtualConsole();virtualConsole.on('jsdomError',e=>errors.push(e.message));
  const dom=new JSDOM(html,{url:'https://first-light.test/',runScripts:'outside-only',virtualConsole});
  const {window}=dom;
  if(state)window.localStorage.setItem(saveKey,serializeSave(state,PACK));
  window.confirm=()=>true;window.scrollTo=()=>{};
  let tones=0;
  window.AudioContext=class {
    state='running';currentTime=0;destination={};
    createOscillator(){return {frequency:{},connect(){},disconnect(){},start(){tones++;},stop(){}};}
    createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};}
  };
  setup(window);window.eval(output[0].code);
  const $=id=>window.document.getElementById(id);
  const concept=name=>[...$('elements').querySelectorAll('button')].find(b=>b.querySelector('b').textContent===name);
  const combine=(a,b)=>{$('clear').click();concept(a).click();concept(b).click();$('combine').click();};
  const saved=()=>JSON.parse(window.localStorage.getItem(saveKey));
  return {window,$,combine,saved,errors,tones:()=>tones,close:()=>dom.window.close()};
}

test('player flow counts every attempt, persists hints and mute, sounds only new discoveries',async()=>{
  const b=browser();
  try {
    assert.equal(b.tones(),0);
    b.$('hint').click();assert.equal(b.saved().hintsUsed,1);
    b.combine('Water','Fire');assert.equal(b.saved().owned.length,7);assert.equal(b.tones(),3);
    b.combine('Water','Fire');assert.equal(b.tones(),3);
    b.combine('Water','Human');b.combine('Human','Water');
    assert.equal(b.saved().combinationsTried,4);assert.equal(b.saved().noReactions.length,1);
    assert.equal(b.tones(),3);
    b.$('mute').click();b.combine('Earth','Fire');assert.equal(b.tones(),3);assert.equal(b.saved().muted,true);
    b.$('copy-feedback').click();await tick();
    assert.equal(b.$('copy-fallback').hidden,false);assert(b.$('copy-text').value.includes('Total combinations tried: 5'));
    b.$('reset').click();assert.equal(b.saved().owned.length,6);assert.equal(b.saved().combinationsTried,0);
    assert.equal(b.saved().hintsUsed,0);assert.equal(b.saved().noReactions.length,0);assert.equal(b.saved().muted,true);
    assert.deepEqual(b.errors,[]);
  } finally {b.close();}
});

test('completion at 100 stays browsable, shares/copies, reloads silently and resets',async()=>{
  const state=freshSave(PACK);state.owned=new Set(PACK.ELEMENTS.filter(e=>e.id!=='mud').map(e=>e.id));
  let shared=null,copied=null;
  const b=browser(state,w=>{
    w.navigator.share=async data=>{shared=data;};
    Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async text=>{copied=text;}}});
  });
  try {
    assert.equal(b.$('completion').hidden,true);
    b.combine('Water','Earth');
    assert.equal(b.$('completion').hidden,false);assert(b.$('status').textContent.includes('Volume 1 complete'));
    b.$('hint').click();assert(b.$('status').textContent.includes('Nothing new'));assert.equal(b.saved().hintsUsed,0);
    b.$('share').click();await tick();assert(shared.text.includes(PACK.shareUrl));
    b.window.navigator.share=async()=>{throw Error('unavailable');};
    b.$('share').click();await tick();assert(copied.includes('100 concepts'));
    copied=null;b.window.navigator.share=async()=>{throw new b.window.DOMException('cancelled','AbortError');};
    b.$('share').click();await tick();assert.equal(copied,null);
    b.$('search').value='star';b.$('search').dispatchEvent(new b.window.Event('input'));
    assert.equal(b.$('elements').querySelectorAll('button').length,1);
    const reload=browser({...state,owned:new Set(b.saved().owned),combinationsTried:1});
    assert.equal(reload.$('completion').hidden,false);assert.equal(reload.tones(),0);reload.close();
    b.$('reset').click();assert.equal(b.$('completion').hidden,true);
    assert.deepEqual(b.errors,[]);
  } finally {b.close();}
});

test('clipboard rejection has legacy and manual copy fallbacks; blocked storage allows play',async()=>{
  const b=browser(undefined,w=>{
    Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async()=>{throw Error('denied');}}});
    w.document.execCommand=()=>true;
    Object.defineProperty(w,'localStorage',{get(){throw Error('blocked');}});
  });
  try {
    b.combine('Water','Earth');assert.equal(b.$('count').textContent,'7 / 100');
    b.$('copy-feedback').click();await tick();assert.equal(b.$('copy-fallback').hidden,true);
    assert(b.$('status').textContent.includes('Feedback copied'));
    b.window.document.execCommand=()=>false;
    b.$('copy-feedback').click();await tick();assert.equal(b.$('copy-fallback').hidden,false);
    assert(b.$('copy-text').value.includes('Discovered: 7/100'));
    assert.deepEqual(b.errors,[]);
  } finally {b.close();}
});
