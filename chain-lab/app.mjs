// Public progressive mechanic test. Uses only the published First Light graph and resolver.
// No provider calls, telemetry, private research files, or hidden-recipe recommendations.
import {ELEMENTS, GRAPH_VERSION, RECIPES, STARTER_IDS, validateSeed} from '../seed.mjs';
import {resolveRecipe} from '../dist/core/resolveRecipe.js';

const $ = id => document.getElementById(id);
const concepts = new Map(ELEMENTS.map(item => [item.id, item]));
const recipes = new Map(RECIPES.map(item => [item.id, item]));
const pairKey = (a, b) => [a, b].sort().join('::');
const concept = id => concepts.get(id);
const name = id => concept(id)?.name ?? id;
const make = (tag, text = '', className = '') => {
  const el = document.createElement(tag);
  el.textContent = text;
  if (className) el.className = className;
  return el;
};

const GROUP_META = Object.freeze({
  primordial:{name:'Primordial',mark:'✦'}, natural:{name:'Nature',mark:'◌'}, material:{name:'Materials',mark:'◆'},
  life:{name:'Life',mark:'❧'}, making:{name:'Making',mark:'⌁'}, settlement:{name:'Civilization',mark:'⌂'},
  knowledge:{name:'Knowledge',mark:'◇'}, technology:{name:'Technology',mark:'⚙'}, culture:{name:'Culture',mark:'♪'}
});
const GROUP_ORDER = Object.keys(GROUP_META);

function newState() {
  validateSeed();
  return {
    version: GRAPH_VERSION,
    owned: new Set(STARTER_IDS),
    witnessed: new Set(),
    chains: [],
    attempts: [],
    arrangement: 0
  };
}

let state = newState();
let selectedA = null;
let selectedB = null;
let activeGroup = 'primordial';
let lastDiscovery = null;
let branchChainId = null;
let justRevealedGroup = null;

function check() {
  if (state.version !== GRAPH_VERSION) throw Error('World version changed. Reset this test.');
}
function discoveredGroups() {
  return GROUP_ORDER.filter(group => ELEMENTS.some(item => item.group === group && state.owned.has(item.id)));
}
function phaseName() {
  const groups = new Set(discoveredGroups());
  if (groups.has('technology') || groups.has('culture')) return 'Systems';
  if (groups.has('knowledge') || groups.has('settlement')) return 'Civilization';
  if (groups.has('making')) return 'Making';
  if (groups.has('life')) return 'Living';
  if (groups.has('material')) return 'Matter';
  if (groups.has('natural')) return 'Formation';
  return 'Origins';
}
function announce(message) { $('status').textContent = message; }
function witnessedRecipes() {
  return RECIPES.filter(recipe => recipe.status === 'active' && state.witnessed.has(recipe.id) &&
    [recipe.inputAId, recipe.inputBId, recipe.resultId].every(id => state.owned.has(id)));
}
function availablePaths() {
  const known = witnessedRecipes();
  const paths = [];
  for (const first of known) {
    for (const second of known) {
      if (first.id === second.id) continue;
      if (![second.inputAId, second.inputBId].includes(first.resultId)) continue;
      const id = `${first.id}:${second.id}`;
      if (state.chains.some(chain => chain.id === id)) continue;
      paths.push({id, first, second});
    }
  }
  return paths;
}
function recipeText(recipe) {
  return `${name(recipe.inputAId)} + ${name(recipe.inputBId)} → ${name(recipe.resultId)}`;
}

function revealDiscovery(resultId, oldGroups) {
  lastDiscovery = resultId;
  const item = concept(resultId);
  const newGroups = discoveredGroups().filter(group => !oldGroups.includes(group));
  justRevealedGroup = newGroups[0] ?? null;
  $('discovery-name').textContent = item.name;
  $('discovery-meta').textContent = justRevealedGroup
    ? `${GROUP_META[item.group].mark} ${item.groupName} has opened.`
    : `${item.groupName} · added to your world`;
  $('discovery').hidden = false;
  if (justRevealedGroup) activeGroup = justRevealedGroup;
}
function hideDiscovery() {
  lastDiscovery = null;
  justRevealedGroup = null;
  $('discovery').hidden = true;
}
function experiment(a, b, origin = 'free') {
  check();
  if (!state.owned.has(a) || !state.owned.has(b)) throw Error('Both concepts must already be in your world.');
  const oldGroups = discoveredGroups();
  const resolved = resolveRecipe(a, b, RECIPES, {ownedElementIds: state.owned});
  const recipe = resolved.type === 'recipe' ? resolved.recipe : null;
  const resultId = recipe?.resultId ?? null;
  const novel = !!resultId && !state.owned.has(resultId);
  if (recipe) {
    state.witnessed.add(recipe.id);
    state.owned.add(recipe.resultId);
  }
  state.attempts.push({a, b, pair:pairKey(a,b), origin, resultId, novel});
  if (!recipe) {
    announce('No reaction. Try another relationship.');
  } else if (novel) {
    announce(`${name(a)} + ${name(b)} became ${name(resultId)}.`);
    revealDiscovery(resultId, oldGroups);
  } else {
    announce(`${name(a)} + ${name(b)} returns ${name(resultId)}.`);
  }
  return recipe;
}

function choose(id) {
  if (!state.owned.has(id)) return;
  if (selectedA === null) {
    selectedA = id;
    selectedB = null;
    if (!branchChainId) announce(`${name(id)} selected. Choose what to meet it with.`);
  } else if (selectedB === null) {
    selectedB = id;
    announce(`${name(selectedA)} + ${name(selectedB)}. Ready.`);
  } else {
    selectedB = id;
    announce(`${name(selectedA)} + ${name(selectedB)}. Ready.`);
  }
  render();
}
function clearSelection(message = 'Choose two concepts.') {
  selectedA = null;
  selectedB = null;
  if (!branchChainId) announce(message);
  render();
}
function combineSelected() {
  if (selectedA === null || selectedB === null) return;
  try {
    if (branchChainId) {
      const chain = state.chains.find(item => item.id === branchChainId);
      if (!chain || chain.phase !== 'branch' || chain.intermediate !== selectedA) throw Error('That branch is no longer active.');
      experiment(selectedA, selectedB, 'branch');
    } else {
      experiment(selectedA, selectedB, 'free');
    }
    selectedB = null;
  } catch (error) {
    announce(error.message);
  }
  render();
}

function installPath(firstId, secondId) {
  const first = recipes.get(firstId);
  const second = recipes.get(secondId);
  if (!first || !second || !state.witnessed.has(first.id) || !state.witnessed.has(second.id) ||
      first.id === second.id || ![second.inputAId, second.inputBId].includes(first.resultId)) {
    throw Error('That connection is no longer available.');
  }
  const id = `${first.id}:${second.id}`;
  if (state.chains.some(chain => chain.id === id)) throw Error('Already built.');
  state.chains.push({id, firstId:first.id, secondId:second.id, intermediate:first.resultId, phase:'ready', version:GRAPH_VERSION});
  state.arrangement++;
  announce(`${name(first.resultId)} is now a junction you can operate.`);
  render();
  setTimeout(() => $('structures').scrollIntoView({behavior:'smooth',block:'start'}), 0);
}
function chainAction(chainId, action) {
  const chain = state.chains.find(item => item.id === chainId);
  if (!chain || chain.version !== GRAPH_VERSION) throw Error('Structure is stale.');
  const first = recipes.get(chain.firstId);
  const second = recipes.get(chain.secondId);
  if (!first || !second) throw Error('Structure is invalid.');

  if (action === 'stage') {
    if (!['ready','complete'].includes(chain.phase)) throw Error('Resolve the current junction first.');
    const found = experiment(first.inputAId, first.inputBId, 'stage');
    if (found?.id !== first.id) throw Error('World law changed.');
    chain.phase = 'junction';
    branchChainId = null;
    selectedA = null;
    selectedB = null;
    announce(`${name(chain.intermediate)} is at the junction.`);
  } else if (action === 'continue') {
    if (chain.phase !== 'junction') throw Error('Stage the junction first.');
    const found = experiment(second.inputAId, second.inputBId, 'continue');
    if (found?.id !== second.id) throw Error('World law changed.');
    chain.phase = 'complete';
    announce(`The known path resolves to ${name(second.resultId)}.`);
  } else if (action === 'branch') {
    if (chain.phase !== 'junction') throw Error('Stage the junction first.');
    chain.phase = 'branch';
    state.arrangement++;
    branchChainId = chain.id;
    selectedA = chain.intermediate;
    selectedB = null;
    activeGroup = discoveredGroups()[0] ?? 'primordial';
    announce(`${name(chain.intermediate)} is held open. Choose any partner.`);
    setTimeout(() => $('world').scrollIntoView({behavior:'smooth',block:'start'}), 0);
  } else if (action === 'reset') {
    chain.phase = 'ready';
    state.arrangement++;
    if (branchChainId === chain.id) {
      branchChainId = null;
      selectedA = null;
      selectedB = null;
    }
    announce('Junction reset.');
  }
  render();
}

function button(text, action, className = '') {
  const el = make('button', text, className);
  el.type = 'button';
  el.addEventListener('click', () => {
    try { action(); } catch (error) { announce(error.message); render(); }
  });
  return el;
}

function renderHeader() {
  $('phase').textContent = phaseName();
  $('progress-count').textContent = `${state.owned.size} / ${ELEMENTS.length}`;
  $('progress-fill').style.width = `${(state.owned.size / ELEMENTS.length) * 100}%`;
}
function renderMixer() {
  $('slot-a').querySelector('strong').textContent = selectedA ? name(selectedA) : 'Choose';
  $('slot-b').querySelector('strong').textContent = selectedB ? name(selectedB) : 'Choose';
  $('combine').disabled = selectedA === null || selectedB === null;
  const chain = branchChainId ? state.chains.find(item => item.id === branchChainId) : null;
  $('branchbar').hidden = !chain;
  if (chain) $('branch-label').textContent = `Branching from ${name(chain.intermediate)}`;
}
function renderTabs() {
  const groups = discoveredGroups();
  if (!groups.includes(activeGroup)) activeGroup = groups[0] ?? 'primordial';
  const root = $('tabs');
  root.replaceChildren();
  root.hidden = groups.length <= 1;
  for (const group of groups) {
    const meta = GROUP_META[group];
    const count = ELEMENTS.filter(item => item.group === group && state.owned.has(item.id)).length;
    const tab = button(`${meta.mark} ${meta.name} ${count}`, () => { activeGroup = group; renderWorld(); }, 'tab');
    tab.setAttribute('aria-pressed', String(group === activeGroup));
    root.append(tab);
  }
}
function renderWorld() {
  const groups = discoveredGroups();
  renderTabs();
  const ownedCount = state.owned.size;
  $('search').hidden = ownedCount < 14;
  const term = $('search').hidden ? '' : $('search').value.trim().toLowerCase();
  const meta = GROUP_META[activeGroup];
  $('world-subtitle').textContent = meta?.name ?? 'World';
  const items = ELEMENTS.filter(item => item.group === activeGroup && state.owned.has(item.id) && item.name.toLowerCase().includes(term))
    .sort((a,b) => a.name.localeCompare(b.name));
  const root = $('concept-grid');
  root.replaceChildren();
  for (const item of items) {
    const card = button('', () => choose(item.id), 'concept');
    card.setAttribute('aria-pressed', String(item.id === selectedA || item.id === selectedB));
    card.append(make('b', item.name));
    if (item.id === selectedA) card.append(make('small','Concept A'));
    else if (item.id === selectedB) card.append(make('small','Concept B'));
    root.append(card);
  }
  if (!items.length) root.append(make('div','No match in this category.','empty'));
}
function renderMemory() {
  const known = witnessedRecipes();
  $('memory').hidden = known.length === 0;
  if (!known.length) return;
  $('memory-count').textContent = `${known.length}`;
  const root = $('memory-list');
  root.replaceChildren();
  const visible = known.slice(-5).reverse();
  for (const recipe of visible) {
    const row = make('div','', 'memory-row');
    row.append(make('span',`${name(recipe.inputAId)} + ${name(recipe.inputBId)}`), make('span','→','arrow'), make('span',name(recipe.resultId),'result'));
    root.append(row);
  }
  const extra = known.length - visible.length;
  $('memory-more').textContent = extra > 0 ? `+ ${extra} earlier relationship${extra === 1 ? '' : 's'}` : '';
}
function renderPattern() {
  const paths = availablePaths();
  $('pattern').hidden = paths.length === 0;
  if (!paths.length) return;
  const {first,second} = paths[0];
  const card = make('div','', 'pattern');
  card.append(make('div','connection discovered','pattern-eyebrow'));
  const path = make('div','', 'path');
  path.append(document.createTextNode(`${name(first.inputAId)} + ${name(first.inputBId)} → `), make('span',name(first.resultId),'junction'), document.createTextNode(` → + ${second.inputAId === first.resultId ? name(second.inputBId) : name(second.inputAId)} → ${name(second.resultId)}`));
  card.append(path, make('div',`${name(first.resultId)} now sits between two relationships you already know.`,'subtle'));
  card.append(button(`Make ${name(first.resultId)} a junction`, () => installPath(first.id,second.id), 'primary'));
  $('pattern-card').replaceChildren(card);
}
function renderStructures() {
  $('structures').hidden = state.chains.length === 0;
  if (!state.chains.length) return;
  const root = $('structure-list');
  root.replaceChildren();
  for (const chain of state.chains) {
    const first = recipes.get(chain.firstId);
    const second = recipes.get(chain.secondId);
    const card = make('article','', 'structure');
    card.append(make('div',`${name(chain.intermediate)} junction`,'structure-title'),
      make('div',`${recipeText(first)}  ·  ${recipeText(second)}`,'structure-flow'));
    const choice = make('div','', 'choice');
    const actions = make('div','', 'choice-actions');
    if (chain.phase === 'ready') {
      choice.append(make('strong','Dormant'), make('p',`Stage ${name(chain.intermediate)} to open the junction.`));
      actions.classList.add('one');
      actions.append(button(`Stage ${name(chain.intermediate)}`, () => chainAction(chain.id,'stage'), 'emphasis'));
    } else if (chain.phase === 'junction') {
      choice.append(make('strong',`${name(chain.intermediate)} is open`), make('p','Follow what you know, or turn the junction outward.'));
      actions.append(button(`Continue → ${name(second.resultId)}`, () => chainAction(chain.id,'continue')),
        button('Branch', () => chainAction(chain.id,'branch'), 'emphasis'));
    } else if (chain.phase === 'branch') {
      choice.append(make('strong',`Branching from ${name(chain.intermediate)}`), make('p','The junction is loaded as Concept A. Pick any discovered partner above.'));
      actions.classList.add('one');
      actions.append(button('Close branch', () => chainAction(chain.id,'reset')));
    } else {
      choice.append(make('strong',`Resolved → ${name(second.resultId)}`), make('p','The known path is complete. Reopen it when you want another decision point.'));
      actions.classList.add('one');
      actions.append(button(`Reopen ${name(chain.intermediate)}`, () => chainAction(chain.id,'stage'), 'emphasis'));
    }
    choice.append(actions);
    card.append(choice);
    root.append(card);
  }
}
function renderRecord() {
  const distinct = new Set(state.attempts.map(item => item.pair)).size;
  const novel = state.attempts.filter(item => item.novel).length;
  const branches = state.attempts.filter(item => item.origin === 'branch').length;
  $('metrics').textContent = `${state.attempts.length} attempts · ${distinct} pairs · ${novel} discoveries · ${branches} branch experiments`;
  const root = $('history');
  root.replaceChildren();
  for (const item of state.attempts.slice(-10).reverse()) {
    root.append(make('li',`${name(item.a)} + ${name(item.b)} → ${item.resultId ? name(item.resultId) : 'no reaction'}`));
  }
}
function render() {
  renderHeader();
  renderMixer();
  renderWorld();
  renderMemory();
  renderPattern();
  renderStructures();
  renderRecord();
}

$('slot-a').addEventListener('click', () => {
  selectedA = null;
  if (branchChainId) {
    const chain = state.chains.find(item => item.id === branchChainId);
    if (chain) { chain.phase = 'ready'; branchChainId = null; }
  }
  announce('Choose Concept A.');
  render();
});
$('slot-b').addEventListener('click', () => { selectedB = null; announce('Choose Concept B.'); render(); });
$('combine').addEventListener('click', combineSelected);
$('clear').addEventListener('click', () => {
  if (branchChainId) {
    const chain = state.chains.find(item => item.id === branchChainId);
    if (chain) chain.phase = 'ready';
    branchChainId = null;
  }
  clearSelection();
});
$('return-path').addEventListener('click', () => {
  if (!branchChainId) return;
  const chain = state.chains.find(item => item.id === branchChainId);
  if (chain) chain.phase = 'junction';
  branchChainId = null;
  selectedA = null;
  selectedB = null;
  announce('Back at the junction.');
  render();
  setTimeout(() => $('structures').scrollIntoView({behavior:'smooth',block:'start'}),0);
});
$('use-discovery').addEventListener('click', () => {
  if (!lastDiscovery || !state.owned.has(lastDiscovery)) return;
  selectedA = lastDiscovery;
  selectedB = null;
  activeGroup = concept(lastDiscovery).group;
  announce(`${name(lastDiscovery)} is Concept A. What should it meet?`);
  hideDiscovery();
  render();
});
$('search').addEventListener('input', renderWorld);
$('reset').addEventListener('click', () => {
  if (!confirm('Reset this experimental world? Your original First Light save is untouched.')) return;
  state = newState();
  selectedA = null;
  selectedB = null;
  activeGroup = 'primordial';
  lastDiscovery = null;
  branchChainId = null;
  $('search').value = '';
  hideDiscovery();
  announce('Tap two concepts below.');
  render();
});

render();