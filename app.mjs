import { resolveRecipe } from './dist/core/resolveRecipe.js';
import { ELEMENTS, GRAPH_VERSION, RECIPES, STARTER_IDS, validateSeed } from './seed.mjs';

import {PACK} from './active-pack.mjs';
import {readSave, serializeSave, freshSave} from './save.mjs';

const theme=document.getElementById('pack-theme');
if(theme) theme.href=PACK.theme;
document.title=PACK.title;
document.querySelector('meta[name="theme-color"]').content=PACK.themeColor;
document.getElementById('version').textContent=`Version ${PACK.version} · ${PACK.volumeLabel}`;

const $ = id => document.getElementById(id);
const inventory = new Map(ELEMENTS.map(item => [item.id, item]));
const saveKey = PACK.savePrefix + GRAPH_VERSION;
const groupOrder = Object.keys(PACK.CATEGORY_LABELS);
const groupLabels = new Map(Object.entries(PACK.CATEGORY_LABELS));

let selectedA = null;
let selectedB = null;
let activeGroup = 'all';
let lastDiscovery = null;

let storage;
try { storage=window.localStorage; } catch { /* session-only play */ }
let state = readSave(storage, PACK);

function persist() {
  try {
    storage?.setItem(saveKey, serializeSave(state, PACK));
  } catch { /* session-only fallback */ }
}
function item(id){ return inventory.get(id); }
function label(id){ return item(id)?.name ?? id; }
function create(tag, className='', text=''){
  const node=document.createElement(tag); if(className) node.className=className; if(text) node.textContent=text; return node;
}
function announce(text){ $('status').textContent=text; }
function discoveredGroups(){
  const present=new Set(ELEMENTS.filter(e=>state.owned.has(e.id)).map(e=>e.group));
  return groupOrder.filter(group=>present.has(group));
}
function recentRank(id){
  const index=state.history.findIndex(entry=>entry.result===id);
  return index<0 ? 9999 : index;
}
function showDiscovery(id,a,b){
  lastDiscovery=id;
  $('discovery-name').textContent=label(id);
  $('discovery-meta').textContent=`${label(a)} + ${label(b)} · ${item(id).groupName}`;
  $('discovery').hidden=false;
}
function hideDiscovery(){ lastDiscovery=null; $('discovery').hidden=true; }

function selectConcept(id){
  if(!state.owned.has(id)) return;
  if(selectedA===null){
    selectedA=id; selectedB=null;
    announce(`${label(id)} selected. Choose a second concept.`);
  } else if(selectedB===null){
    selectedB=id;
    announce(`${label(selectedA)} + ${label(selectedB)} is ready.`);
  } else {
    selectedB=id;
    announce(`Second concept changed to ${label(id)}.`);
  }
  render();
}

function combineSelected(){
  if(selectedA===null || selectedB===null) return;
  const a=selectedA, b=selectedB;
  const resolution=resolveRecipe(a,b,RECIPES,{ownedElementIds:state.owned});
  if(resolution.type==='no-reaction'){
    announce(`${label(a)} + ${label(b)}: no reaction. Try another partner.`);
    selectedB=null;
    render(); return;
  }
  const result=resolution.recipe.resultId;
  const novel=!state.owned.has(result);
  state.owned.add(result);
  if(novel){
    state.history.unshift({a,b,result});
    state.history=state.history.slice(0,80);
    persist();
    showDiscovery(result,a,b);
    announce(`${label(result)} discovered.`);
  } else {
    announce(`${label(a)} + ${label(b)} → ${label(result)}. Already known.`);
  }
  // Keep A in place for quick hypothesis testing against several partners.
  selectedB=null;
  render();
}

function renderTabs(){
  const root=$('tabs'); root.replaceChildren();
  const groups=discoveredGroups();
  if(!groups.includes(activeGroup) && activeGroup!=='all') activeGroup='all';
  if(groups.length<=1){ root.hidden=true; activeGroup=groups[0] ?? 'all'; return; }
  root.hidden=false;
  const choices=['all',...groups];
  for(const group of choices){
    const button=create('button','tab',group==='all'?'All':groupLabels.get(group));
    button.type='button'; button.setAttribute('aria-pressed',String(activeGroup===group));
    button.addEventListener('click',()=>{ activeGroup=group; render(); });
    root.append(button);
  }
}

function renderConcepts(){
  renderTabs();
  const searchEl=$('search');
  const searchUnlocked=state.owned.size>=18;
  searchEl.hidden=!searchUnlocked;
  if(!searchUnlocked) searchEl.value='';
  const term=searchEl.value.trim().toLocaleLowerCase();
  let visible=ELEMENTS.filter(e=>state.owned.has(e.id));
  if(activeGroup!=='all') visible=visible.filter(e=>e.group===activeGroup);
  if(term) visible=visible.filter(e=>e.name.toLocaleLowerCase().includes(term));
  visible.sort((a,b)=>{
    const ra=recentRank(a.id), rb=recentRank(b.id);
    if(ra!==rb) return ra-rb;
    return a.name.localeCompare(b.name);
  });
  const groups=discoveredGroups();
  $('world-sub').textContent=activeGroup==='all' ? `${groups.length} categories discovered` : groupLabels.get(activeGroup);
  $('visible-count').textContent=`${visible.length} shown`;
  const root=$('elements'); root.replaceChildren();
  for(const concept of visible){
    const button=create('button','concept'); button.type='button';
    button.setAttribute('aria-pressed',String(selectedA===concept.id || selectedB===concept.id));
    const name=create('b','',concept.name);
    const recent=recentRank(concept.id);
    const meta=create('small',recent<4?'fresh':'',recent<4 && !STARTER_IDS.includes(concept.id)?`New · ${concept.groupName}`:concept.groupName);
    button.append(name,meta);
    button.addEventListener('click',()=>selectConcept(concept.id));
    root.append(button);
  }
  if(!visible.length) root.append(create('div','empty','No discovered concept matches this view.'));
}

function renderMemory(){
  const memory=$('memory');
  memory.hidden=state.history.length===0;
  if(memory.hidden) return;
  const root=$('journal'); root.replaceChildren();
  for(const entry of state.history.slice(0,8)){
    const row=create('div','memory-row');
    row.append(document.createTextNode(`${label(entry.a)} + ${label(entry.b)} → `),create('strong','',label(entry.result)));
    root.append(row);
  }
  $('memory-more').textContent=state.history.length>8 ? `${state.history.length-8} earlier discoveries preserved` : '';
}

function render(){
  $('count').textContent=`${state.owned.size} / ${ELEMENTS.length}`;
  $('bar').style.width=`${(state.owned.size/ELEMENTS.length)*100}%`;
  const a=$('slot-a'), b=$('slot-b');
  a.querySelector('strong').textContent=selectedA?label(selectedA):'Choose';
  b.querySelector('strong').textContent=selectedB?label(selectedB):'Choose';
  a.classList.toggle('filled',selectedA!==null); b.classList.toggle('filled',selectedB!==null);
  $('combine').disabled=selectedA===null || selectedB===null;
  renderConcepts(); renderMemory();
}

$('combine').addEventListener('click',combineSelected);
$('clear').addEventListener('click',()=>{selectedA=null;selectedB=null;announce('Selection cleared.');render();});
$('slot-a').addEventListener('click',()=>{if(selectedA!==null){selectedA=null;selectedB=null;announce('First concept cleared.');render();}});
$('slot-b').addEventListener('click',()=>{if(selectedB!==null){selectedB=null;announce('Second concept cleared.');render();}});
$('search').addEventListener('input',render);
$('use-discovery').addEventListener('click',()=>{
  if(!lastDiscovery || !state.owned.has(lastDiscovery)) return;
  selectedA=lastDiscovery; selectedB=null; activeGroup=item(lastDiscovery).group;
  announce(`${label(lastDiscovery)} selected. What does it interact with?`);
  hideDiscovery(); render();
  window.scrollTo({top:0,behavior:'smooth'});
});
$('reset').addEventListener('click',()=>{
  if(!confirm(`Reset all ${PACK.title} discoveries on this device?`)) return;
  state=freshSave(PACK); selectedA=null;selectedB=null;activeGroup='all';hideDiscovery();
  $('search').value='';persist();announce('World reset. Six starting concepts remain.');render();
});

try{
  const report=validateSeed();
  if(report.elementCount!==100) throw Error(`Expected 100 concepts, found ${report.elementCount}`);
  persist();
  render();
}catch(error){
  announce(`This build failed validation: ${error.message}`);
  $('combine').disabled=true;
  console.error(error);
}
