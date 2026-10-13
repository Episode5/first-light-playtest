import {recordNoReaction} from './player.mjs';

export function freshSave(pack) {
  return {owned:new Set(pack.STARTER_IDS), history:[], hintsUsed:0,
    combinationsTried:0,noReactions:[],muted:false,trackingSinceUpgrade:false};
}

export function cleanSave(stored, pack) {
  if (!stored || !Array.isArray(stored.owned)) return null;
  const ids=new Set(pack.ELEMENTS.map(e=>e.id));
  const owned=new Set(stored.owned.filter(id=>ids.has(id)));
  for (const id of pack.STARTER_IDS) owned.add(id);
  const history=(Array.isArray(stored.history)?stored.history:[])
    .filter(e=>e && [e.a,e.b,e.result].every(id=>ids.has(id)));
  // A valid discovery record is also evidence of ownership.
  for (const e of history) owned.add(e.result);
  const count=value=>Number.isSafeInteger(value)&&value>=0?value:0;
  const attempts=(Array.isArray(stored.noReactions)?stored.noReactions:[])
    .filter(e=>e && ids.has(e.a)&&ids.has(e.b));
  let noReactions=[];
  for(const e of [...attempts].reverse()) noReactions=recordNoReaction(noReactions,e.a,e.b);
  return {owned, history:history.filter((e,i)=>history.findIndex(other=>other.result===e.result)===i).slice(0,100),
    hintsUsed:count(stored.hintsUsed),combinationsTried:count(stored.combinationsTried),noReactions,
    muted:stored.muted===true,trackingSinceUpgrade:stored.trackingSinceUpgrade===true || !Number.isSafeInteger(stored.combinationsTried)};
}

export function readSave(storage, pack) {
  const read=key=>{
    try { return cleanSave(JSON.parse(storage?.getItem(key) ?? 'null'),pack); }
    catch { return null; }
  };
  // An authoritative new-format save (including Reset) stops legacy re-import.
  const current=read(pack.savePrefix+pack.GRAPH_VERSION);
  if (current) return current;
  const merged=freshSave(pack);
  for (const key of pack.legacySaveKeys) {
    const legacy=read(key);
    if (!legacy) continue;
    merged.trackingSinceUpgrade=true;
    for (const id of legacy.owned) merged.owned.add(id);
    for (const entry of legacy.history) {
      if (!merged.history.some(e=>e.result===entry.result)) merged.history.push(entry);
    }
  }
  return merged;
}

export function serializeSave(state, pack) {
  return JSON.stringify({...state,graphVersion:pack.GRAPH_VERSION, owned:[...state.owned]});
}
