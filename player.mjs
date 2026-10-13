export const pairKey=(a,b)=>[a,b].sort().join('::');

export function recordNoReaction(attempts,a,b) {
  return [{a,b},...attempts.filter(e=>pairKey(e.a,e.b)!==pairKey(a,b))].slice(0,20);
}

export function feedbackText(state,pack) {
  const names=new Map(pack.ELEMENTS.map(e=>[e.id,e.name]));
  const name=id=>names.get(id)??id;
  return [
    `${pack.title} — version ${pack.version} (${pack.GRAPH_VERSION})`,
    `Discovered: ${state.owned.size}/${pack.ELEMENTS.length}`,
    `Hints used: ${state.hintsUsed}`,
    `Total combinations tried: ${state.combinationsTried}${state.trackingSinceUpgrade?' (tracked since v0.5; earlier attempts unavailable)':''}`,
    'Last 20 no-reaction attempts (most recent first, deduplicated):',
    ...(state.noReactions.length?state.noReactions.map(e=>`- ${name(e.a)} + ${name(e.b)}`):['- None recorded']),
    'Last 5 discoveries (most recent first):',
    ...(state.history.length?state.history.slice(0,5).map(e=>`- ${name(e.a)} + ${name(e.b)} → ${name(e.result)}`):['- None recorded'])
  ].join('\n');
}

export function completionText(state,pack) {
  return `I discovered all ${pack.ELEMENTS.length} concepts in ${pack.title}! ${state.combinationsTried} combinations${state.trackingSinceUpgrade?' tracked since v0.5':''}, ${state.hintsUsed} hints.\n${pack.shareUrl}`;
}
