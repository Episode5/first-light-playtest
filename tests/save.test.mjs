import test from 'node:test';
import assert from 'node:assert/strict';
import {PACK} from '../active-pack.mjs';
import {readSave,serializeSave,freshSave,cleanSave} from '../save.mjs';
const storage=entries=>({getItem:key=>entries[key]??null});
const json=owned=>JSON.stringify({owned,history:[]});
const currentKey=PACK.savePrefix+PACK.GRAPH_VERSION;

test('both v0.1 and v0.2 discoveries survive a one-way migration',()=>{
  const entries={[PACK.legacySaveKeys[0]]:json(['tree']),[PACK.legacySaveKeys[1]]:json(['glass'])};
  const before=structuredClone(entries);
  const state=readSave(storage(entries),PACK);
  assert(state.owned.has('tree'));assert(state.owned.has('glass'));
  assert.equal(state.owned.size,8);assert.equal(state.trackingSinceUpgrade,true);
  assert.deepEqual(entries,before);
});
test('corrupt keys are isolated; old malformed history never discards owned discoveries',()=>{
  const entries={[currentKey]:'{bad',[PACK.legacySaveKeys[0]]:'{bad',[PACK.legacySaveKeys[1]]:JSON.stringify({owned:['glass','unknown'],history:'broken'})};
  assert(readSave(storage(entries),PACK).owned.has('glass'));
  assert.equal(readSave(storage(entries),PACK).owned.size,7);
  assert.equal(readSave({getItem(){throw Error('blocked');}},PACK).owned.size,6);
  assert.equal(readSave(undefined,PACK).owned.size,6);
});
test('current saves and Reset stay authoritative across reloads',()=>{
  const state=freshSave(PACK);state.muted=true;
  const entries={[currentKey]:serializeSave(state,PACK),[PACK.legacySaveKeys[0]]:json(['tree'])};
  const read=readSave(storage(entries),PACK);
  assert.equal(read.owned.size,6);assert.equal(read.muted,true);
  assert.equal(read.trackingSinceUpgrade,false);
});
test('history also preserves discoveries and malformed telemetry fields are sanitized',()=>{
  const state=cleanSave({owned:[],history:[{a:'water',b:'fire',result:'steam'},null],
    hintsUsed:-5,combinationsTried:'bad',noReactions:[{a:'human',b:'water'},{a:'water',b:'human'},{a:'bad',b:'water'}]},PACK);
  assert(state.owned.has('steam'));assert.equal(state.history.length,1);
  assert.equal(state.hintsUsed,0);assert.equal(state.combinationsTried,0);
  assert.equal(state.noReactions.length,1);
});
test('counters, mute, no reactions and discovery order round-trip',()=>{
  const state=freshSave(PACK);
  state.owned.add('steam');state.history=[{a:'fire',b:'water',result:'steam'}];
  state.hintsUsed=3;state.combinationsTried=7;state.noReactions=[{a:'human',b:'water'}];state.muted=true;
  assert.deepEqual(readSave(storage({[currentKey]:serializeSave(state,PACK)}),PACK),state);
});
