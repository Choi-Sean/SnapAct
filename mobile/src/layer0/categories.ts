import { Category } from '../types';

// Mirrors backend/app/pricing.py's LAYER0_CATEGORIES / LAYER1_TOKEN_COST —
// keep both in sync if either changes.
export const LAYER0_CATEGORIES: readonly Category[] = ['medication', 'document', 'other'];
export const LAYER1_TOKEN_COST = 10;
