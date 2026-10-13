import test from 'node:test';
import assert from 'node:assert/strict';
import {ELEMENTS,STARTER_IDS,RECIPES,validateSeed} from '../seed.mjs';
import {resolveRecipe} from '../dist/core/resolveRecipe.js';

test('100 concepts, six starters, full reachability, unique pairs and reverse symmetry',()=>{
  assert.deepEqual(validateSeed(),{elementCount:100,recipeCount:RECIPES.length,starterCount:6,reachableCount:100});
  const state={ownedElementIds:new Set(ELEMENTS.map(e=>e.id))};
  for(const r of RECIPES){
    assert.equal(resolveRecipe(r.inputAId,r.inputBId,RECIPES,state).recipe.resultId,r.resultId);
    assert.equal(resolveRecipe(r.inputBId,r.inputAId,RECIPES,state).recipe.resultId,r.resultId);
  }
  for(const [a,result] of [['stone','gravel'],['water','ocean'],['air','sky']])
    assert.equal(resolveRecipe(a,a,RECIPES,state).recipe.resultId,result);
  assert.equal(resolveRecipe('water','human',RECIPES,state).type,'no-reaction');
  assert.equal(STARTER_IDS.length,6);
});
