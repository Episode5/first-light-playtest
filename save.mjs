export function freshSave(pack) {
  return {owned:new Set(pack.STARTER_IDS), history:[]};
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
  return {owned, history:history.slice(0,100)};
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
    for (const id of legacy.owned) merged.owned.add(id);
    for (const entry of legacy.history) {
      if (!merged.history.some(e=>e.result===entry.result)) merged.history.push(entry);
    }
  }
  return merged;
}

export function serializeSave(state, pack) {
  return JSON.stringify({graphVersion:pack.GRAPH_VERSION, owned:[...state.owned], history:state.history});
}
