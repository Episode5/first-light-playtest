// Public, isolated playtest. Uses only already-published First Light content and resolver.
// No private research code, AI calls, remote telemetry, or changes to the original save.
import {ELEMENTS, GRAPH_VERSION, RECIPES, STARTER_IDS, validateSeed} from '../seed.mjs';
import {resolveRecipe} from '../dist/core/resolveRecipe.js';

const $ = id => document.getElementById(id);
const concepts = new Map(ELEMENTS.map(item => [item.id, item]));
const recipes = new Map(RECIPES.map(item => [item.id, item]));
const mode = new URLSearchParams(location.search).get('mode') === 'baseline' ? 'baseline' : 'chains';
const key = (a, b) => [a, b].sort().join('::');
const concept = id => concepts.get(id);
const label = id => concept(id)?.name ?? id;
const description = recipe => `${label(recipe.inputAId)} + ${label(recipe.inputBId)} → ${label(recipe.resultId)}`;
const make = (tag, content = '', className = '') => {
  const el = document.createElement(tag);
  el.textContent = content;
  if (className) el.className = className;
  return el;
};

const GROUPS = Object.freeze({
  primordial:{icon:'✦',name:'Primordial',description:'Starting forces and basic elements.'},
  natural:{icon:'◌',name:'Nature',description:'Environmental forms and natural transformations.'},
  material:{icon:'◆',name:'Materials',description:'Substances that can become parts, surfaces and objects.'},
  life:{icon:'❧',name:'Life',description:'Living things, growth and organisms.'},
  making:{icon:'⚒',name:'Making',description:'Tools, crafted parts and practical objects.'},
  settlement:{icon:'⌂',name:'Civilization',description:'Homes, settlements and larger built communities.'},
  knowledge:{icon:'◇',name:'Knowledge',description:'Learning, records, experiments and ideas.'},
  technology:{icon:'⚙',name:'Technology',description:'Machines, electricity and connected systems.'},
  culture:{icon:'♪',name:'Culture',description:'Sound, society, exchange and shared expression.'}
});
const GROUP_ORDER = Object.keys(GROUPS);
const totalByGroup = new Map(GROUP_ORDER.map(group => [group, ELEMENTS.filter(item => item.group === group).length]));

function initialState() {
  validateSeed();
  const state = {version: GRAPH_VERSION, owned: new Set(STARTER_IDS), witnessed: new Set(),
    chains: [], attempts: [], arrangement: 0};
  // Replay the same actual starter recipes in both modes. Do not count tutorial steps.
  for (const [a, b] of [['water', 'earth'], ['mud', 'fire'], ['earth', 'fire']]) {
    const resolution = resolveRecipe(a, b, RECIPES, {ownedElementIds: state.owned});
    if (resolution.type !== 'recipe') throw Error('Test fixture no longer resolves');
    state.owned.add(resolution.recipe.resultId);
    state.witnessed.add(resolution.recipe.id);
  }
  return state;
}

let state = initialState();
let selectedA = null;
let selectedB = null;
let categoryFilter = 'all';
let lastDiscovery = null;
let benchChainId = null;

$('baseline-link').setAttribute('aria-current', mode === 'baseline' ? 'page' : 'false');
$('chains-link').setAttribute('aria-current', mode === 'chains' ? 'page' : 'false');
$('workshop').hidden = mode !== 'chains';

function announce(message) { $('status').textContent = message; }
function check() {
  if (state.version !== GRAPH_VERSION) throw Error('This graph version changed. Reset the test.');
}
function showDiscovery(id) {
  lastDiscovery = id;
  const item = concept(id);
  $('discovery-text').textContent = `NEW · ${item.name} joined ${item.groupName}.`;
  $('discovery').classList.add('show');
}
function hideDiscovery() {
  lastDiscovery = null;
  $('discovery').classList.remove('show');
}
function experiment(a, b, origin = 'free') {
  check();
  if (!state.owned.has(a) || !state.owned.has(b)) throw Error('Choose two owned concepts.');
  const result = resolveRecipe(a, b, RECIPES, {ownedElementIds: state.owned});
  const found = result.type === 'recipe' ? result.recipe : null;
  const novel = !!found && !state.owned.has(found.resultId);
  if (found) {
    state.owned.add(found.resultId);
    state.witnessed.add(found.id);
  }
  state.attempts.push({a, b, pair: key(a, b), origin, resultId: found?.resultId ?? null, novel});
  if (found) {
    announce(`${label(a)} + ${label(b)} → ${label(found.resultId)}${novel ? ' · New concept added to your world.' : ' · You already knew this result.'}`);
    if (novel) showDiscovery(found.resultId);
  } else {
    announce(`${label(a)} + ${label(b)}: no reaction in this build. Try another direction; this screen does not mark “promising” failures.`);
  }
  return found;
}
function choose(id) {
  if (!state.owned.has(id)) return;
  if (selectedA === null) {
    selectedA = id;
    selectedB = null;
    benchChainId = null;
    announce(`${label(id)} is in Concept A. Pick any owned partner for Concept B.`);
  } else if (selectedB === null) {
    selectedB = id;
    announce(`${label(selectedA)} + ${label(selectedB)} is ready. Press Combine when you want to test it.`);
  } else {
    selectedB = id;
    announce(`Concept B changed to ${label(id)}. Press Combine to test ${label(selectedA)} + ${label(selectedB)}.`);
  }
  render();
}
function clearSelection(message = 'Experiment slots cleared. Choose any concept to start again.') {
  selectedA = null; selectedB = null; benchChainId = null;
  announce(message); render();
}
function combineSelected() {
  if (selectedA === null || selectedB === null) return;
  try {
    if (benchChainId) {
      const chain = state.chains.find(item => item.id === benchChainId);
      if (!chain || chain.phase !== 'diverted' || chain.intermediate !== selectedA)
        throw Error('That branch is no longer active. Start a new experiment.');
      chainAction(chain.id, 'bench', selectedB);
    } else {
      experiment(selectedA, selectedB, 'free');
    }
    // Keep A loaded so exploration becomes “try another partner” rather than repeated setup.
    selectedB = null;
  } catch (error) { announce(`Experiment unavailable: ${error.message}`); }
  render();
}
function witnessedRecipes() {
  return RECIPES.filter(recipe => recipe.status === 'active' && state.witnessed.has(recipe.id) &&
    [recipe.inputAId, recipe.inputBId, recipe.resultId].every(id => state.owned.has(id)));
}
function knownContinuations(recipe, known = witnessedRecipes()) {
  return known.filter(next => next.id !== recipe.id &&
    (next.inputAId === recipe.resultId || next.inputBId === recipe.resultId));
}
function availablePaths() {
  const known = witnessedRecipes();
  const paths = [];
  for (const first of known) for (const second of knownContinuations(first, known)) {
    const id = `${first.id}:${second.id}`;
    if (!state.chains.some(chain => chain.id === id)) paths.push({id, first, second});
  }
  return paths;
}
function install(firstId, secondId) {
  check();
  if (mode !== 'chains') throw Error('Structures are disabled in Explore-only mode.');
  const first = recipes.get(firstId);
  const second = recipes.get(secondId);
  if (!first || !second || !state.witnessed.has(first.id) || !state.witnessed.has(second.id) ||
      first.id === second.id || ![second.inputAId, second.inputBId].includes(first.resultId))
    throw Error('A structure can use only witnessed relationships sharing an exact junction.');
  if (![first.inputAId, first.inputBId, first.resultId, second.inputAId, second.inputBId, second.resultId]
      .every(id => state.owned.has(id))) throw Error('Structure contains an unowned concept.');
  if (state.chains.length >= 3) throw Error('This mechanic test is limited to three structures.');
  const id = `${first.id}:${second.id}`;
  if (state.chains.some(chain => chain.id === id)) throw Error('This path is already built.');
  state.chains.push({id, firstId:first.id, secondId:second.id, intermediate:first.resultId,
    version:GRAPH_VERSION, phase:'ready'});
  state.arrangement++;
  announce(`Built a known path through ${label(first.resultId)}. Nothing ran automatically. Run the first step when you are ready.`);
}
function chainAction(chainId, action, partner = null) {
  check();
  const chain = state.chains.find(item => item.id === chainId);
  if (!chain || chain.version !== GRAPH_VERSION || mode !== 'chains') throw Error('Invalid structure or mode.');
  const first = recipes.get(chain.firstId);
  const second = recipes.get(chain.secondId);
  if (!first || !second || !state.witnessed.has(first.id) || !state.witnessed.has(second.id) ||
      ![second.inputAId, second.inputBId].includes(first.resultId)) throw Error('This structure no longer matches the known graph.');
  if (action === 'first') {
    if (!['ready', 'completed'].includes(chain.phase)) throw Error('Finish or reset the junction first.');
    const result = experiment(first.inputAId, first.inputBId, 'stage-one');
    if (result?.id !== first.id || result.resultId !== chain.intermediate) throw Error('The graph changed.');
    chain.phase = 'intermediate';
    benchChainId = null;
    selectedA = null; selectedB = null;
    announce(`${label(chain.intermediate)} is now sitting at the junction. Continue the known path—or branch from it.`);
  } else if (action === 'second') {
    if (chain.phase !== 'intermediate') throw Error('Run the first step before continuing.');
    const result = experiment(second.inputAId, second.inputBId, 'stage-two');
    if (result?.id !== second.id) throw Error('The graph changed.');
    chain.phase = 'completed';
    benchChainId = null;
    announce(`Known path completed at ${label(second.resultId)}. You can stage the junction again if you want to explore from it.`);
  } else if (action === 'divert') {
    if (chain.phase !== 'intermediate') throw Error('Reach the junction before branching.');
    chain.phase = 'diverted'; state.arrangement++;
    selectedA = chain.intermediate; selectedB = null; benchChainId = chain.id;
    announce(`Branch mode: ${label(chain.intermediate)} is loaded as Concept A. Pick ANY owned concept from the category shelves as Concept B, then press Combine.`);
  } else if (action === 'bench') {
    if (chain.phase !== 'diverted' || chain.intermediate !== selectedA || !state.owned.has(partner))
      throw Error('Branch from the junction first, then choose an owned partner.');
    experiment(chain.intermediate, partner, 'side-bench');
  } else if (action === 'restore') {
    if (chain.phase === 'ready') throw Error('Structure is already ready.');
    chain.phase = 'ready'; state.arrangement++;
    if (benchChainId === chain.id) { benchChainId = null; selectedA = null; selectedB = null; }
    announce('Structure reset to its first step. No concepts were consumed.');
  } else throw Error('Unknown structure action.');
}
function actionButton(text, disabled, action, className = '') {
  const btn = make('button', text, className);
  btn.type = 'button'; btn.disabled = disabled;
  btn.addEventListener('click', () => {
    try { action(); } catch (error) { announce(`Action unavailable: ${error.message}`); }
    render();
  });
  return btn;
}

function renderChips() {
  const root = $('category-chips'); root.replaceChildren();
  const all = actionButton(`All · ${state.owned.size}`, false, () => {categoryFilter='all'; render();}, 'chip');
  all.setAttribute('aria-pressed', String(categoryFilter === 'all')); root.append(all);
  for (const group of GROUP_ORDER) {
    const owned = ELEMENTS.filter(item => item.group === group && state.owned.has(item.id)).length;
    const meta = GROUPS[group];
    const chip = actionButton(`${meta.icon} ${meta.name} ${owned}/${totalByGroup.get(group)}`, false,
      () => {categoryFilter=group; render();}, 'chip');
    chip.setAttribute('aria-pressed', String(categoryFilter === group)); root.append(chip);
  }
}
function conceptButton(item) {
  const button = make('button', '', 'concept');
  button.type = 'button'; button.setAttribute('aria-pressed', String(selectedA === item.id || selectedB === item.id));
  const name = make('span', item.name, 'concept-name');
  const meta = make('span', `${item.groupName}${selectedA === item.id ? ' · Concept A' : selectedB === item.id ? ' · Concept B' : ''}`, 'concept-meta');
  button.append(name, meta); button.addEventListener('click', () => choose(item.id));
  return button;
}
function renderWorld() {
  renderChips();
  const term = $('search').value.trim().toLocaleLowerCase();
  const owned = ELEMENTS.filter(item => state.owned.has(item.id) && item.name.toLocaleLowerCase().includes(term) &&
    (categoryFilter === 'all' || item.group === categoryFilter));
  const categoryCount = new Set(ELEMENTS.filter(item => state.owned.has(item.id)).map(item => item.group)).size;
  $('visible-count').textContent = `${state.owned.size} owned across ${categoryCount} categories · ${ELEMENTS.length} concepts exist in this test world.`;
  const shelves = $('shelves'); shelves.replaceChildren();
  const groups = categoryFilter === 'all' ? GROUP_ORDER.filter(group => owned.some(item => item.group === group)) : [categoryFilter];
  for (const group of groups) {
    const meta = GROUPS[group];
    const items = owned.filter(item => item.group === group).sort((a,b) => a.name.localeCompare(b.name));
    const section = make('section', '', 'shelf');
    const head = make('div', '', 'shelf-head');
    const left = make('div', '', '');
    const title = make('h3', '', 'shelf-title');
    title.append(make('span', meta.icon, 'shelf-icon'), document.createTextNode(meta.name));
    left.append(title, make('p', meta.description, 'small'));
    const ownedCount = ELEMENTS.filter(item => item.group === group && state.owned.has(item.id)).length;
    head.append(left, make('span', `${ownedCount}/${totalByGroup.get(group)} found`, 'shelf-count'));
    section.append(head);
    if (items.length) {
      const grid = make('div', '', 'concept-grid'); items.forEach(item => grid.append(conceptButton(item))); section.append(grid);
    } else {
      section.append(make('div', term ? 'No owned concepts in this category match your search.' : `Nothing discovered in ${meta.name} yet.`, 'empty'));
    }
    shelves.append(section);
  }
  if (!groups.length) shelves.append(make('div', 'No owned concept matches that search.', 'empty'));
}
function renderKnown() {
  const root = $('known'); root.replaceChildren();
  const known = witnessedRecipes();
  for (const recipe of known) {
    const card = make('article', '', 'recipe-card');
    const flow = make('div', '', 'recipe-flow');
    flow.append(document.createTextNode(`${label(recipe.inputAId)} + ${label(recipe.inputBId)} → `),
      make('span', label(recipe.resultId), 'recipe-result'));
    card.append(flow, make('span', concept(recipe.resultId)?.groupName ?? '', 'tag'));
    const continuations = knownContinuations(recipe, known);
    if (continuations.length) card.append(make('p', `${label(recipe.resultId)} already connects onward through ${continuations.length} known relationship${continuations.length === 1 ? '' : 's'}.`, 'small'));
    root.append(card);
  }
  if (!known.length) root.append(make('div', 'No witnessed relationships yet. Explore two concepts to begin.', 'empty'));
}
function pathVisual(first, second) {
  const wrap = make('div', '', 'chain-visual');
  wrap.append(make('div', description(first), 'recipe-flow'), make('div', '↓', 'arrow-down'));
  const junctionLine = make('div', '', ''); junctionLine.append(make('span', `Junction · ${label(first.resultId)}`, 'junction')); wrap.append(junctionLine);
  wrap.append(make('div', '↓', 'arrow-down'), make('div', description(second), 'recipe-flow'));
  return wrap;
}
function renderWorkshop() {
  if (mode !== 'chains') return;
  const options = $('path-options'); options.replaceChildren();
  const paths = availablePaths();
  for (const path of paths) {
    const card = make('article', '', 'path-card');
    card.append(make('h3', 'A known path is available'), pathVisual(path.first, path.second),
      make('p', `Both relationships are already yours. Building this path adds no new recipe; it makes ${label(path.first.resultId)} an explicit decision point.`, 'small'),
      actionButton('Build this structure', false, () => install(path.first.id, path.second.id), 'primary'));
    options.append(card);
  }
  if (!paths.length) {
    const known = witnessedRecipes();
    options.append(make('div', known.length < 2 ?
      'Keep exploring. Once you know more relationships, connected paths can appear here.' :
      'No unbuilt connected path is available from your witnessed relationships right now. Keep exploring; new discoveries may create a connection.', 'empty'));
  }
  renderChains();
}
function renderChains() {
  if (mode !== 'chains') return;
  const root = $('chains'); root.replaceChildren();
  for (const chain of state.chains) {
    const first = recipes.get(chain.firstId);
    const second = recipes.get(chain.secondId);
    const card = make('article', '', 'chain');
    card.append(make('h3', `Structure · ${label(chain.intermediate)} junction`), pathVisual(first, second));
    const choice = make('div', '', 'chain-choice');
    const buttons = make('div', '', 'buttons');
    if (chain.phase === 'ready') {
      choice.append(make('strong', 'Ready to stage the junction.'), make('p', `Run the first known step. ${label(chain.intermediate)} will become the decision point.`, 'small'));
      buttons.append(actionButton(`Run first step → ${label(chain.intermediate)}`, false, () => chainAction(chain.id, 'first'), 'primary'));
    } else if (chain.phase === 'intermediate') {
      choice.append(make('strong', `${label(chain.intermediate)} is at the junction.`), make('p', 'This is the mechanic: continue what you already know, or use the junction as a reason to explore somewhere else.', 'small'));
      buttons.append(
        actionButton(`Continue known path → ${label(second.resultId)}`, false, () => chainAction(chain.id, 'second'), 'secondary'),
        actionButton(`Branch and experiment with ${label(chain.intermediate)}`, false, () => {
          chainAction(chain.id, 'divert');
          setTimeout(() => $('shelves').scrollIntoView({behavior:'smooth',block:'start'}), 0);
        }, 'primary'));
    } else if (chain.phase === 'diverted') {
      choice.append(make('strong', `Branch mode · ${label(chain.intermediate)} is loaded in Concept A.`), make('p', 'Choose ANY owned concept from the category shelves as Concept B. No hidden recipe ranking is guiding you.', 'small'));
      buttons.append(
        actionButton('Go to category shelves', false, () => $('shelves').scrollIntoView({behavior:'smooth',block:'start'}), 'primary'),
        actionButton('Return to known path', false, () => chainAction(chain.id, 'restore'), 'secondary'));
    } else {
      choice.append(make('strong', `Known path completed at ${label(second.resultId)}.`), make('p', 'The path itself was not a discovery. If the junction made you want to try something else, that is the behavior this prototype is testing.', 'small'));
      buttons.append(
        actionButton(`Stage ${label(chain.intermediate)} again`, false, () => chainAction(chain.id, 'first'), 'primary'),
        actionButton('Reset structure', false, () => chainAction(chain.id, 'restore'), 'secondary'));
    }
    choice.append(buttons); card.append(choice); root.append(card);
  }
}
function renderRecord() {
  const distinct = new Set(state.attempts.map(item => item.pair)).size;
  const novel = state.attempts.filter(item => item.novel).length;
  const bench = state.attempts.filter(item => item.origin === 'side-bench').length;
  $('metrics').textContent = `${state.attempts.length} attempts · ${distinct} distinct pairs · ${novel} discoveries · ${bench} branch experiments · ${state.arrangement} structure actions`;
  const history = $('history'); history.replaceChildren();
  for (const item of state.attempts.slice(-12).reverse()) {
    history.append(make('li', `${label(item.a)} + ${label(item.b)} → ${item.resultId ? label(item.resultId) + (item.novel ? ' (NEW)' : '') : 'no reaction'} · ${item.origin}`));
  }
  if (!state.attempts.length) history.append(make('li', 'No player experiments yet. Starter fixture excluded.'));
}
function render() {
  $('slot-a').textContent = selectedA === null ? 'Choose a concept' : label(selectedA);
  $('slot-b').textContent = selectedB === null ? 'Choose another' : label(selectedB);
  $('combine').disabled = selectedA === null || selectedB === null;
  renderWorld(); renderKnown(); renderWorkshop(); renderRecord();
}

$('search').addEventListener('input', render);
$('combine').addEventListener('click', combineSelected);
$('clear').addEventListener('click', () => clearSelection());
$('use-discovery').addEventListener('click', () => {
  if (!lastDiscovery || !state.owned.has(lastDiscovery)) return;
  selectedA = lastDiscovery; selectedB = null; benchChainId = null;
  categoryFilter = concept(lastDiscovery).group;
  announce(`${label(lastDiscovery)} is now Concept A. Pick a partner and see where it leads.`);
  hideDiscovery(); render();
  setTimeout(() => $('shelves').scrollIntoView({behavior:'smooth',block:'start'}), 0);
});
$('reset').addEventListener('click', () => {
  if (!confirm('Reset this separate chain-lab session? Your original First Light save is untouched.')) return;
  state = initialState(); selectedA = null; selectedB = null; benchChainId = null; categoryFilter = 'all';
  $('search').value = ''; hideDiscovery();
  announce('Reset. Start in the category shelves: choose two concepts and press Combine.'); render();
});
render();
