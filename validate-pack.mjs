export function validatePack({ELEMENTS, STARTER_IDS, RECIPES}){
  const ids=new Set(ELEMENTS.map(e=>e.id));
  if(ids.size!==ELEMENTS.length) throw Error('Duplicate concept ID');
  if(new Set(ELEMENTS.map(e=>e.name.toLowerCase())).size!==ELEMENTS.length) throw Error('Duplicate concept name');
  if(STARTER_IDS.some(id=>!ids.has(id))) throw Error('Unknown starter');
  const keys=new Set();
  for(const recipe of RECIPES){
    if([recipe.inputAId,recipe.inputBId,recipe.resultId].some(id=>!ids.has(id))) throw Error(`Dangling recipe ${recipe.id}`);
    const key=[recipe.inputAId,recipe.inputBId].sort().join('::');
    if(keys.has(key)) throw Error(`Conflicting duplicate pair ${key}`);
    keys.add(key);
  }
  const reachable=new Set(STARTER_IDS);
  let changed=true;
  while(changed){
    changed=false;
    for(const recipe of RECIPES){
      if(reachable.has(recipe.inputAId)&&reachable.has(recipe.inputBId)&&!reachable.has(recipe.resultId)){
        reachable.add(recipe.resultId); changed=true;
      }
    }
  }
  const missing=ELEMENTS.filter(e=>!reachable.has(e.id)).map(e=>e.id);
  if(missing.length) throw Error(`Unreachable elements: ${missing.join(', ')}`);
  if(RECIPES.length<ELEMENTS.length-STARTER_IDS.length) throw Error('Insufficient discovery paths');
  return {elementCount:ELEMENTS.length,recipeCount:RECIPES.length,starterCount:STARTER_IDS.length,reachableCount:reachable.size};
}
