import { resolveRecipe } from './dist/core/resolveRecipe.js';
import { ELEMENTS, GRAPH_VERSION, RECIPES, STARTER_IDS, validateSeed } from './seed.mjs';

const inventory = new Map(ELEMENTS.map(element => [element.id, element]));
const saveKey = `doodle-god-exp:save:${GRAPH_VERSION}`;
const $ = id => document.getElementById(id);
const elementsEl = $('elements');
const journalEl = $('journal');
const noticeEl = $('notice');
let selected = null;

function readSave() {
  const initial = {owned: new Set(STARTER_IDS), history: []};
  try {
    const raw = localStorage.getItem(saveKey);
    if (!raw) return initial;
    const stored = JSON.parse(raw);
    if (stored.graphVersion !== GRAPH_VERSION || !Array.isArray(stored.owned) || !Array.isArray(stored.history)) return initial;
    const owned = new Set(stored.owned.filter(id => inventory.has(id)));
    for (const starter of STARTER_IDS) owned.add(starter);
    const history = stored.history.filter(item => item && inventory.has(item.a) && inventory.has(item.b) && inventory.has(item.result)).slice(0, 40);
    return {owned, history};
  } catch { return initial; }
}

let state = readSave();
function persist() {
  try {
    localStorage.setItem(saveKey, JSON.stringify({graphVersion: GRAPH_VERSION, owned: [...state.owned], history: state.history}));
  } catch { /* Browsers with disabled storage can still play the current session. */ }
}
function label(id) { return inventory.get(id)?.name || id; }
function announce(message, kind = '') {
  noticeEl.textContent = message;
  noticeEl.className = `notice ${kind}`.trim();
}
function createElement(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function combine(a, b) {
  selected = null;
  if (!state.owned.has(a) || !state.owned.has(b)) {
    announce('That element is not in your collection.', 'fail');
    render(); return;
  }
  const resolution = resolveRecipe(a, b, RECIPES, {ownedElementIds: state.owned});
  if (resolution.type === 'no-reaction') {
    announce(`${label(a)} + ${label(b)}: no reaction. Try another pair.`, 'fail');
    render(); return;
  }
  const result = resolution.recipe.resultId;
  const novel = !state.owned.has(result);
  state.owned.add(result);
  if (novel) {
    state.history.unshift({a, b, result});
    state.history = state.history.slice(0, 40);
    persist();
    announce(`New discovery: ${label(result)}! ${label(a)} + ${label(b)}.`, 'new');
  } else {
    announce(`${label(a)} + ${label(b)} produces ${label(result)}. Already discovered.`);
  }
  render();
}

function select(id) {
  if (!state.owned.has(id)) return;
  if (selected === null) {
    selected = id;
    announce(`${label(id)} selected. Choose any second element, including ${label(id)} again.`);
    render();
    return;
  }
  combine(selected, id);
}

function render() {
  $('slot-a').textContent = selected ? label(selected) : 'Choose one';
  $('slot-a').classList.toggle('filled', Boolean(selected));
  $('slot-b').textContent = 'Choose another';
  $('slot-b').classList.remove('filled');
  $('count').textContent = `${state.owned.size} / ${ELEMENTS.length}`;
  $('bar').style.width = `${(state.owned.size / ELEMENTS.length) * 100}%`;
  const search = $('search').value.trim().toLocaleLowerCase();
  const visible = ELEMENTS.filter(element => state.owned.has(element.id) && element.name.toLocaleLowerCase().includes(search))
    .sort((a,b) => a.name.localeCompare(b.name));
  $('filtered').textContent = `${visible.length} visible`;
  elementsEl.replaceChildren();
  for (const element of visible) {
    const tile = createElement('button', 'tile');
    tile.type = 'button'; tile.draggable = true;
    tile.setAttribute('aria-pressed', String(selected === element.id));
    tile.setAttribute('aria-label', `${element.name}, ${element.groupName}; select to combine`);
    tile.append(createElement('span','name', element.name),createElement('span','group', element.groupName));
    tile.addEventListener('click', () => select(element.id));
    tile.addEventListener('dragstart', event => {
      event.dataTransfer.setData('text/plain', element.id);
      event.dataTransfer.effectAllowed = 'move';
    });
    tile.addEventListener('dragover', event => {event.preventDefault(); event.dataTransfer.dropEffect = 'move';});
    tile.addEventListener('drop', event => {
      event.preventDefault();
      const source = event.dataTransfer.getData('text/plain');
      if (state.owned.has(source)) combine(source, element.id);
    });
    elementsEl.append(tile);
  }
  if (visible.length === 0) elementsEl.append(createElement('p', 'empty', 'Nothing in your collection matches that search.'));
  journalEl.replaceChildren();
  for (const entry of state.history) {
    const li = createElement('li');
    li.append(document.createTextNode(`${label(entry.a)} + ${label(entry.b)} → `),createElement('strong','',label(entry.result)));
    journalEl.append(li);
  }
  if (state.history.length === 0) journalEl.append(createElement('li','empty','Your first discovery will appear here.'));
}

$('search').addEventListener('input', render);
$('reset').addEventListener('click', () => {
  if (!window.confirm('Reset discoveries for this experimental graph version on this browser? This cannot be undone.')) return;
  selected = null;
  state = {owned: new Set(STARTER_IDS), history: []};
  persist(); announce('World reset. Six starting elements await your first discovery.'); render();
});
try {
  validateSeed();
  render();
} catch (error) {
  announce(`Prototype data failed validation: ${error.message}`, 'fail');
  elementsEl.append(createElement('p','empty','This graph is not playable until its source is repaired.'));
  console.error(error);
}
