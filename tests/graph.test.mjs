import test from 'node:test';
import assert from 'node:assert/strict';
import {ELEMENTS,STARTER_IDS,RECIPES,validateSeed} from '../seed.mjs';
import {resolveRecipe} from '../dist/core/resolveRecipe.js';
import {readFileSync} from 'node:fs';
import {PACK} from '../active-pack.mjs';
import {analyzeGraph} from '../scripts/graph-report.mjs';

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

test('Volume 1 has no dead ends, at most 25 single paths and preserves v0.2 depths',()=>{
  const baseline=JSON.parse(readFileSync(new URL('../docs/content/v02-baseline.json',import.meta.url)));
  const graph=analyzeGraph(PACK);
  assert.equal(graph.terminals.length,0);
  assert.ok(graph.singlePaths.length<=25);
  assert.deepEqual(ELEMENTS.map(({id,name})=>({id,name})),baseline.concepts.map(({id,name})=>({id,name})));
  for(const e of baseline.concepts) assert.ok(graph.depths.get(e.id)>=e.depth-1,`${e.name} became too early`);
  for(const r of baseline.recipes) assert.deepEqual(RECIPES.find(candidate=>candidate.id===r.id),r);
  for(const r of RECIPES.filter(r=>r.resultId==='music')) assert.ok([r.inputAId,r.inputBId].includes('sound'));
  for(const r of RECIPES.filter(r=>r.resultId==='rhythm')) assert.ok([r.inputAId,r.inputBId].includes('music'));
});

test('prerequisite report deduplicates shared branches and uses deterministic shallowest ties',()=>{
  const make=(a,b,c,id)=>({inputAId:a,inputBId:b,resultId:c,id});
  const pack={ELEMENTS:['a','b','c','d','e'].map(id=>({id})),STARTER_IDS:['a','b'],RECIPES:[
    make('a','b','c','r1'),make('c','a','d','r2'),make('d','c','e','r3'),make('c','b','d','r4')
  ]};
  const report=analyzeGraph(pack);
  assert.equal(report.depths.get('e'),3);
  assert.deepEqual([...report.prerequisites.get('e')].sort(),['a','b','c','d']);
  assert.equal(report.chosen.get('d'),'r2');
  assert.deepEqual(analyzeGraph({...pack,RECIPES:[...pack.RECIPES].reverse()}).prerequisites,report.prerequisites);
});
