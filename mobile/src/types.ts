export type Category = 'business_card' | 'receipt' | 'event_flyer' | 'document' | 'medication' | 'other';
export type SuggestedAction = 'contact' | 'calendar' | 'note' | 'reminder' | 'none';
export type MealRelation = 'before_meal' | 'after_meal' | 'with_meal' | 'unspecified';

export interface ContactPayload {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  company?: string | null;
  title?: string | null;
}

export interface CalendarPayload {
  title?: string | null;
  location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  notes?: string | null;
}

export interface MedicationPayload {
  name?: string | null;
  dosage?: string | null;
  times_per_day?: number | null;
  duration_days?: number | null;
  relation_to_meal?: MealRelation | null;
  specific_times?: string[] | null;
  notes?: string | null;
}

export interface AnalyzeResponse {
  mock: boolean;
  category: Category;
  confidence: number;
  suggested_action: SuggestedAction;
  contact?: ContactPayload | null;
  calendar?: CalendarPayload | null;
  medication?: MedicationPayload | null;
  needs_time_selection?: boolean;
  requires_tokens?: boolean;
  raw_text?: string | null;
  summary?: string | null;
}

export type DemoKey =
  | 'business_card'
  | 'event'
  | 'receipt'
  | 'reminder'
  | 'photo'
  | 'mail'
  | 'sms'
  | 'maps'
  | 'files'
  | 'wallet'
  | 'notification';

export interface HistoryField {
  label: string;
  value: string;
}

// Lets a history entry be replayed later (e.g. the user deleted the contact by
// accident) without spending another AI call — just re-runs the same native
// save with the same payload that was used the first time.
export interface ReplaySpec {
  kind: DemoKey;
  payload: unknown;
  // True only for the playground's fixed showcase saves (ReviewModal), which
  // intentionally exercise every native field with filler data. Real saves
  // (from actual photo analysis) omit this — replaying them must only ever
  // use the data that was actually extracted, nothing decorative.
  demo?: boolean;
}

export interface BatchSubEntry {
  photoUri: string;
  category: Category;
  title: string;
  detail: string;
  savedTo: string;
  replay?: ReplaySpec;
}

export interface HistoryEntry {
  id: string;
  type: DemoKey | 'batch';
  title: string;
  detail: string;
  savedTo: string;
  createdAt: string;
  fields?: HistoryField[];
  replay?: ReplaySpec;
  batchItems?: BatchSubEntry[];
  imageUri?: string;
  photoCount?: number;
}
