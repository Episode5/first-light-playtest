import { resolveRecipe } from './dist/core/resolveRecipe.js';
import { ELEMENTS, GRAPH_VERSION, LEGACY_GRAPH_VERSION, RECIPES, STARTER_IDS, validateSeed } from './seed.mjs';

const $ = id => document.getElementById(id);
const inventory = new Map(ELEMENTS.map(item => [item.id, item]));
const saveKey = `doodle-god-exp:save:${GRAPH_VERSION}`;
const legacyKey = `doodle-god-exp:save:${LEGACY_GRAPH_VERSION}`;
const groupOrder = ['primordial','natural','material','life','making','settlement','knowledge','technology','culture'];
const groupLabels = new Map(ELEMENTS.map(item => [item.group, item.groupName]));

let selectedA = null;
let selectedB = null;
let activeGroup = 'all';
let lastDiscovery = null;

function cleanSave(stored) {
  if (!stored || !Array.isArray(stored.owned) || !Array.isArray(stored.history)) return null;
  const owned = new Set(stored.owned.filter(id => inventory.has(id)));
  for (const starter of STARTER_IDS) owned.add(starter);
  const history = stored.history
    .filter(item => item && inventory.has(item.a) && inventory.has(item.b) && inventory.has(item.result))
    .slice(0, 80);
  return {owned, history};
}

function readSave() {
  const fresh = {owned:new Set(STARTER_IDS), history:[]};
  try {
    const currentRaw = localStorage.getItem(saveKey);
    if (currentRaw) return cleanSave(JSON.parse(currentRaw)) ?? fresh;

    // One-way convenience migration: preserve valid v0.1 discoveries, then save as v0.2.
    const legacyRaw = localStorage.getItem(legacyKey);
    if (legacyRaw) {
      const legacy = cleanSave(JSON.parse(legacyRaw));
      if (legacy) return legacy;
    }
  } catch { /* localStorage may be unavailable; session play still works. */ }
  return fresh;
}

let state = readSave();

function persist() {
  try {
    localStorage.setItem(saveKey, JSON.stringify({graphVersion:GRAPH_VERSION, owned:[...state.owned], history:state.history}));
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
  if(!confirm('Reset all First Light v0.2 discoveries on this device?')) return;
  state={owned:new Set(STARTER_IDS),history:[]}; selectedA=null;selectedB=null;activeGroup='all';hideDiscovery();
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
