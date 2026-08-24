import { Category } from '../types';

// Mirrors backend/app/pricing.py's LAYER0_CATEGORIES / LAYER2_TOKEN_COST —
// keep both in sync if either changes. LAYER2_TOKEN_COST is a forward
// reference for a not-yet-built feature — nothing in this app spends
// tokens right now, see pricing.py's header for why.
export const LAYER0_CATEGORIES: readonly Category[] = ['medication', 'document', 'other'];
export const LAYER2_TOKEN_COST = 10;
