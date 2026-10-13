// Compatibility exports for existing graph consumers.
import {PACK} from './active-pack.mjs';
import {validatePack} from './validate-pack.mjs';
export const {ELEMENTS, GRAPH_VERSION, RECIPES, STARTER_IDS, CATEGORY_LABELS} = PACK;
export const validateSeed = () => validatePack(PACK);
