import test from 'node:test';
import assert from 'node:assert/strict';
import {recordNoReaction,feedbackText,completionText} from '../player.mjs';
import {freshSave} from '../save.mjs';
import {PACK} from '../active-pack.mjs';

test('no reactions cap at 20, deduplicate reverse pairs and promote repeats',()=>{
  let attempts=[];
  for(let i=0;i<25;i++) attempts=recordNoReaction(attempts,'a',String(i));
  assert.equal(attempts.length,20);assert.equal(attempts.at(-1).b,'5');
  attempts=recordNoReaction(attempts,'5','a');
  assert.deepEqual(attempts[0],{a:'5',b:'a'});assert.equal(attempts.length,20);
});
test('feedback includes requested local fields and only the last five discoveries',()=>{
  const state=freshSave(PACK);
  state.hintsUsed=2;state.combinationsTried=9;
  state.noReactions=[{a:'water',b:'human'}];
  state.history=Array.from({length:6},()=>({a:'water',b:'fire',result:'steam'}));
  const text=feedbackText(state,PACK);
  for(const s of ['version 0.5','Discovered: 6/100','Hints used: 2','Total combinations tried: 9','Water + Human']) assert(text.includes(s));
  assert.equal(text.split('→ Steam').length-1,5);
  assert(completionText(state,PACK).includes(PACK.shareUrl));
});
