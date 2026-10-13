import test from 'node:test';
import assert from 'node:assert/strict';
import {findHint} from '../hint.mjs';
import {PACK} from '../active-pack.mjs';
const recipe=(a,b,result,extra={})=>({id:`${a}-${b}`,inputAId:a,inputBId:b,resultId:result,status:'active',priority:0,variantPrerequisites:[],...extra});

test('hint selects newest qualifying discovery and never returns partner/result data',()=>{
  const state={owned:new Set(['water','fire','earth','mud','steam']),history:[{result:'steam'},{result:'mud'}]};
  const recipes=[recipe('mud','fire','brick'),recipe('steam','earth','cloud')];
  assert.equal(findHint(state,recipes),'steam');
  state.owned.delete('earth');
  assert.equal(findHint(state,recipes),'mud');
  assert.equal(state.history.length,2);
});
test('hint respects ownership, known results, disabled recipes and resolver prerequisites',()=>{
  const state={owned:new Set(['a','b','known']),history:[]};
  assert.equal(findHint(state,[recipe('a','b','known')]),null);
  assert.equal(findHint(state,[recipe('a','missing','new')]),null);
  assert.equal(findHint(state,[recipe('a','b','new',{status:'draft'})]),null);
  assert.equal(findHint(state,[recipe('a','b','new',{variantPrerequisites:['missing']})]),null);
  assert.equal(findHint(state,[recipe('a','a','new')]),'a');
});
test('hint uses winning variant and returns null at completion',()=>{
  const state={owned:new Set(['a','b','known']),history:[]};
  assert.equal(findHint(state,[recipe('a','b','new',{id:'base'}),recipe('b','a','known',{id:'variant',variantPrerequisites:['known']})]),null);
  assert.equal(findHint({owned:new Set(PACK.ELEMENTS.map(e=>e.id)),history:[]},PACK.RECIPES),null);
});
