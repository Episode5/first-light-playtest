import {resolveRecipe} from './dist/core/resolveRecipe.js';

// Returns only one owned concept ID. History is newest first; no partner/result leaks.
export function findHint({owned,history},recipes) {
  const candidates=new Set();
  const checked=new Set();
  for(const r of recipes) {
    if(!owned.has(r.inputAId)||!owned.has(r.inputBId)) continue;
    const key=[r.inputAId,r.inputBId].sort().join('::');
    if(checked.has(key)) continue;
    checked.add(key);
    const resolution=resolveRecipe(r.inputAId,r.inputBId,recipes,{ownedElementIds:owned});
    if(resolution.type==='recipe'&&!owned.has(resolution.recipe.resultId)) {
      candidates.add(r.inputAId); candidates.add(r.inputBId);
    }
  }
  const recent=[...history.map(e=>e.result),...[...owned].reverse()];
  return recent.find(id=>owned.has(id)&&candidates.has(id)) ?? null;
}
