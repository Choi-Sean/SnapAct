export type Category = 'business_card' | 'receipt' | 'event_flyer' | 'document' | 'other';
export type SuggestedAction = 'contact' | 'calendar' | 'note' | 'none';

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

export interface AnalyzeResponse {
  mock: boolean;
  category: Category;
  confidence: number;
  suggested_action: SuggestedAction;
  contact?: ContactPayload | null;
  calendar?: CalendarPayload | null;
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
}
