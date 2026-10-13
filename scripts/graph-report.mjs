import {pathToFileURL} from 'node:url';
import {PACK} from '../active-pack.mjs';

export function analyzeGraph({ELEMENTS,RECIPES,STARTER_IDS}) {
  const inputs=new Map(ELEMENTS.map(e=>[e.id,0]));
  const outputs=new Map(ELEMENTS.map(e=>[e.id,0]));
  const depths=new Map(ELEMENTS.map(e=>[e.id,STARTER_IDS.includes(e.id)?0:Infinity]));
  for(const r of RECIPES) {
    for(const id of new Set([r.inputAId,r.inputBId])) inputs.set(id,inputs.get(id)+1);
    outputs.set(r.resultId,outputs.get(r.resultId)+1);
  }
  let changed=true;
  while(changed) {
    changed=false;
    for(const r of RECIPES) {
      const depth=1+Math.max(depths.get(r.inputAId),depths.get(r.inputBId));
      if(depth<depths.get(r.resultId)){depths.set(r.resultId,depth);changed=true;}
    }
  }
  // Equal-depth ties use the canonical input pair, then recipe ID (code-point order).
  const recipeKey=r=>[r.inputAId,r.inputBId].sort().join('::')+'::'+r.id;
  const chosen=new Map();
  const prerequisites=new Map();
  const required=id=>{
    if(prerequisites.has(id)) return prerequisites.get(id);
    const set=new Set();
    if(depths.get(id)>0 && Number.isFinite(depths.get(id))) {
      const candidates=RECIPES.filter(r=>r.resultId===id &&
        1+Math.max(depths.get(r.inputAId),depths.get(r.inputBId))===depths.get(id));
      candidates.sort((a,b)=>recipeKey(a)<recipeKey(b)?-1:recipeKey(a)>recipeKey(b)?1:0);
      const r=candidates[0]; chosen.set(id,r.id);
      for(const input of [r.inputAId,r.inputBId]) {
        set.add(input);
        for(const ancestor of required(input)) set.add(ancestor);
      }
    }
    prerequisites.set(id,set); return set;
  };
  for(const e of ELEMENTS) required(e.id);
  return {inputs,outputs,depths,prerequisites,chosen,
    terminals:ELEMENTS.filter(e=>inputs.get(e.id)===0),
    singleInputs:ELEMENTS.filter(e=>inputs.get(e.id)===1),
    singlePaths:ELEMENTS.filter(e=>!STARTER_IDS.includes(e.id)&&outputs.get(e.id)===1)};
}

export function formatReport(pack) {
  const g=analyzeGraph(pack);
  const names=items=>items.map(e=>e.name).join(', ') || 'none';
  return [
    `Concepts: ${pack.ELEMENTS.length}; recipes: ${pack.RECIPES.length}; starters: ${pack.STARTER_IDS.length}`,
    `Terminal concepts (${g.terminals.length}): ${names(g.terminals)}`,
    `Used in only one recipe (${g.singleInputs.length}): ${names(g.singleInputs)}`,
    `Single-path non-starters (${g.singlePaths.length}): ${names(g.singlePaths)}`,
    'Concept | depth (minimum layers) | distinct prerequisites (report only)',
    ...pack.ELEMENTS.map(e=>`  ${e.name}: ${g.depths.get(e.id)} | ${g.prerequisites.get(e.id).size}`)
  ].join('\n');
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) console.log(formatReport(PACK));
