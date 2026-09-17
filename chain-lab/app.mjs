// Public, isolated playtest. Uses only already-published First Light content and resolver.
// No private research code, AI calls, remote telemetry, or changes to the original save.
import {ELEMENTS, GRAPH_VERSION, RECIPES, STARTER_IDS, validateSeed} from '../seed.mjs';
import {resolveRecipe} from '../dist/core/resolveRecipe.js';

const $ = id => document.getElementById(id);
const labels = new Map(ELEMENTS.map(item => [item.id, item.name]));
const recipes = new Map(RECIPES.map(item => [item.id, item]));
const mode = new URLSearchParams(location.search).get('mode') === 'baseline' ? 'baseline' : 'chains';
const label = id => labels.get(id) ?? id;
const key = (a, b) => [a, b].sort().join('::');
const description = recipe => `${label(recipe.inputAId)} + ${label(recipe.inputBId)} → ${label(recipe.resultId)}`;
const make = (tag, content = '', className = '') => {
  const el = document.createElement(tag);
  el.textContent = content;
  if (className) el.className = className;
  return el;
};

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
let pinned = null;
$('baseline-link').setAttribute('aria-current', mode === 'baseline' ? 'page' : 'false');
$('chains-link').setAttribute('aria-current', mode === 'chains' ? 'page' : 'false');
$('workshop').hidden = mode !== 'chains';

function announce(message) { $('status').textContent = message; }
function check() {
  if (state.version !== GRAPH_VERSION) throw Error('This graph version changed. Reset the test.');
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
  announce(found ? `${label(a)} + ${label(b)} → ${label(found.resultId)}${novel ? ' · NEW DISCOVERY!' : ' · already known.'}` :
    `${label(a)} + ${label(b)}: no reaction in this build. No hint or certified negative implied.`);
  return found;
}
function choose(id) {
  if (!state.owned.has(id)) return;
  if (pinned === null) {
    pinned = id;
    announce(`${label(id)} pinned. Select a partner; a second tap on ${label(id)} tests a self-pair.`);
  } else {
    try { experiment(pinned, id); } catch (error) { announce(error.message); }
  }
  render();
}
function witnessedRecipes() {
  return RECIPES.filter(recipe => recipe.status === 'active' && state.witnessed.has(recipe.id) &&
    [recipe.inputAId, recipe.inputBId, recipe.resultId].every(id => state.owned.has(id)));
}
function selectOptions(select, choices, prior) {
  select.replaceChildren();
  for (const recipe of choices) {
    const option = make('option', description(recipe));
    option.value = recipe.id;
    select.append(option);
  }
  if (choices.some(recipe => recipe.id === prior)) select.value = prior;
  select.disabled = choices.length === 0;
}
function renderInstallPicker() {
  if (mode !== 'chains') return;
  const known = witnessedRecipes();
  const first = $('stage-one');
  const second = $('stage-two');
  const oldFirst = first.value;
  const oldSecond = second.value;
  selectOptions(first, known, oldFirst);
  const start = recipes.get(first.value);
  const compatible = start ? known.filter(recipe => recipe.id !== start.id &&
    (recipe.inputAId === start.resultId || recipe.inputBId === start.resultId)) : [];
  selectOptions(second, compatible, oldSecond);
  $('install').disabled = !compatible.length || state.chains.length >= 3;
}
function install() {
  check();
  if (mode !== 'chains') throw Error('Install is disabled in baseline mode.');
  const first = recipes.get($('stage-one').value);
  const second = recipes.get($('stage-two').value);
  if (!first || !second || !state.witnessed.has(first.id) || !state.witnessed.has(second.id) ||
      first.id === second.id || ![second.inputAId, second.inputBId].includes(first.resultId))
    throw Error('Select two witnessed recipes sharing an exact intermediate.');
  if (![first.inputAId, first.inputBId, first.resultId, second.inputAId, second.inputBId, second.resultId]
      .every(id => state.owned.has(id))) throw Error('Chain contains unowned concepts.');
  if (state.chains.length >= 3) throw Error('The experimental limit is three chains.');
  const id = `${first.id}:${second.id}`;
  if (state.chains.some(chain => chain.id === id)) throw Error('This chain is already installed.');
  state.chains.push({id, firstId: first.id, secondId: second.id, intermediate: first.resultId,
    version: GRAPH_VERSION, phase: 'ready'});
  state.arrangement++;
  announce(`Installed ${description(first)} → ${description(second)}. No experiment has run automatically.`);
}
function chainAction(chainId, action, partner = null) {
  check();
  const chain = state.chains.find(item => item.id === chainId);
  if (!chain || chain.version !== GRAPH_VERSION || mode !== 'chains') throw Error('Invalid chain or mode.');
  const first = recipes.get(chain.firstId);
  const second = recipes.get(chain.secondId);
  if (!first || !second || !state.witnessed.has(first.id) || !state.witnessed.has(second.id) ||
      ![second.inputAId, second.inputBId].includes(first.resultId)) throw Error('Stale chain.');
  if (action === 'first') {
    if (!['ready', 'completed'].includes(chain.phase)) throw Error('Restore or complete this stage first.');
    const result = experiment(first.inputAId, first.inputBId, 'stage-one');
    if (result?.id !== first.id || result.resultId !== chain.intermediate) throw Error('The graph changed.');
    chain.phase = 'intermediate';
  } else if (action === 'second') {
    if (chain.phase !== 'intermediate') throw Error('Activate the first stage first.');
    const result = experiment(second.inputAId, second.inputBId, 'stage-two');
    if (result?.id !== second.id) throw Error('The graph changed.');
    chain.phase = 'completed';
  } else if (action === 'divert') {
    if (chain.phase !== 'intermediate') throw Error('Stage one must finish before diversion.');
    chain.phase = 'diverted'; state.arrangement++;
    announce(`${label(chain.intermediate)} diverted. Choose ANY owned partner, without hidden-recipe hints.`);
  } else if (action === 'bench') {
    if (chain.phase !== 'diverted' || !state.owned.has(partner)) throw Error('Divert first and choose an owned concept.');
    experiment(chain.intermediate, partner, 'side-bench');
  } else if (action === 'restore') {
    if (chain.phase === 'ready') throw Error('Chain is already ready.');
    chain.phase = 'ready'; state.arrangement++; announce('Chain restored. No concept was consumed.');
  } else throw Error('Unknown action.');
}
function actionButton(text, disabled, action) {
  const btn = make('button', text);
  btn.type = 'button'; btn.disabled = disabled;
  btn.addEventListener('click', () => {
    try { action(); } catch (error) { announce(`Action unavailable: ${error.message}`); }
    render();
  });
  return btn;
}
function renderChains() {
  if (mode !== 'chains') return;
  const root = $('chains'); root.replaceChildren();
  for (const chain of state.chains) {
    const first = recipes.get(chain.firstId);
    const second = recipes.get(chain.secondId);
    const card = make('article', '', 'chain');
    card.append(make('p', description(first)), make('p', description(second)),
      make('p', `Junction: ${label(chain.intermediate)} · ${chain.phase}`));
    const controls = make('div', '', 'buttons');
    controls.append(
      actionButton('Activate first', !['ready', 'completed'].includes(chain.phase), () => chainAction(chain.id, 'first')),
      actionButton('Activate second', chain.phase !== 'intermediate', () => chainAction(chain.id, 'second')),
      actionButton('Divert', chain.phase !== 'intermediate', () => chainAction(chain.id, 'divert')),
      actionButton('Restore', chain.phase === 'ready', () => chainAction(chain.id, 'restore'))
    );
    card.append(controls);
    if (chain.phase === 'diverted') {
      const bench = make('div', '', 'bench');
      const labelEl = make('label', `${label(chain.intermediate)} + choose an owned partner`);
      const selector = document.createElement('select');
      selector.setAttribute('aria-label', 'Side bench partner');
      for (const concept of ELEMENTS.filter(item => state.owned.has(item.id))) {
        const option = make('option', concept.name); option.value = concept.id; selector.append(option);
      }
      labelEl.append(selector);
      bench.append(labelEl, actionButton('Test this pair', false, () => chainAction(chain.id, 'bench', selector.value)));
      card.append(bench);
    }
    root.append(card);
  }
  if (!state.chains.length) root.append(make('p', 'Nothing installed yet. The picker contains witnessed recipes only.', 'small'));
}
function render() {
  $('selected').textContent = pinned === null ? 'None' : label(pinned);
  $('owned-count').textContent = `${state.owned.size} / ${ELEMENTS.length} owned`;
  const term = $('search').value.trim().toLocaleLowerCase();
  const visible = ELEMENTS.filter(item => state.owned.has(item.id) && item.name.toLocaleLowerCase().includes(term))
    .sort((a, b) => a.name.localeCompare(b.name));
  $('visible-count').textContent = `${visible.length} visible`;
  const inventory = $('inventory'); const scroll = inventory.scrollTop;
  inventory.replaceChildren();
  for (const concept of visible) {
    const button = make('button', concept.name);
    button.type = 'button'; button.setAttribute('aria-pressed', String(pinned === concept.id));
    button.addEventListener('click', () => choose(concept.id)); inventory.append(button);
  }
  inventory.scrollTop = scroll;
  renderInstallPicker(); renderChains();
  const distinct = new Set(state.attempts.map(item => item.pair)).size;
  const novel = state.attempts.filter(item => item.novel).length;
  const bench = state.attempts.filter(item => item.origin === 'side-bench').length;
  $('metrics').textContent = `${state.attempts.length} attempts · ${distinct} distinct pairs · ${novel} discoveries · ${bench} bench attempts · ${state.arrangement} arrangement actions`;
  const history = $('history'); history.replaceChildren();
  for (const item of state.attempts.slice(-12).reverse()) {
    history.append(make('li', `${label(item.a)} + ${label(item.b)} → ${item.resultId ? label(item.resultId) + (item.novel ? ' (NEW)' : '') : 'no reaction'} · ${item.origin}`));
  }
  if (!state.attempts.length) history.append(make('li', 'No experiments yet. Starter fixture excluded.'));
}
$('search').addEventListener('input', render);
$('stage-one').addEventListener('change', renderInstallPicker);
$('install').addEventListener('click', () => {
  try { install(); } catch (error) { announce(`Cannot install: ${error.message}`); }
  render();
});
$('clear').addEventListener('click', () => { pinned = null; announce('Selection cleared.'); render(); });
$('reset').addEventListener('click', () => {
  if (!confirm('Reset this separate chain-lab session? Your original First Light save is untouched.')) return;
  state = initialState(); pinned = null; $('search').value = '';
  announce('Reset. Baseline and chains both start from identical known discoveries.'); render();
});
render();
