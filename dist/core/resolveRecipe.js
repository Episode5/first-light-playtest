// Standalone JavaScript equivalent of the private project's deterministic TypeScript
// resolveRecipe implementation. No network requests or model calls.
function canonicalPairKey(aId, bId) {
  return aId <= bId ? `${aId}::${bId}` : `${bId}::${aId}`;
}
function prerequisitesSatisfied(recipe, state) {
  return recipe.variantPrerequisites.every(id => state.ownedElementIds.has(id));
}
function isStrictSuperset(candidate, other) {
  if (candidate.length <= other.length) return false;
  const candidateSet = new Set(candidate);
  return other.every(id => candidateSet.has(id));
}
export function resolveRecipe(inputAId, inputBId, recipes, state) {
  const key = canonicalPairKey(inputAId, inputBId);
  const eligible = recipes
    .filter(recipe => recipe.status === 'active')
    .filter(recipe => canonicalPairKey(recipe.inputAId, recipe.inputBId) === key)
    .filter(recipe => prerequisitesSatisfied(recipe, state));
  if (eligible.length === 0) return { type: 'no-reaction' };
  const maximal = eligible.filter(recipe => !eligible.some(other =>
    other.id !== recipe.id && isStrictSuperset(other.variantPrerequisites, recipe.variantPrerequisites)
  ));
  maximal.sort((a, b) => b.priority - a.priority);
  if (maximal.length > 1 && maximal[0].priority === maximal[1].priority) {
    throw new Error(`Ambiguous canonical recipes for ${key}: ${maximal[0].id} and ${maximal[1].id}`);
  }
  return { type: 'recipe', recipe: maximal[0] };
}
