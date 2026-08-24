from typing import Literal, Optional

from pydantic import BaseModel

Category = Literal["business_card", "receipt", "event_flyer", "document", "medication", "other"]
SuggestedAction = Literal["contact", "calendar", "note", "reminder", "none"]
MealRelation = Literal["before_meal", "after_meal", "with_meal", "unspecified"]


class ContactPayload(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    company: Optional[str] = None
    title: Optional[str] = None


class CalendarPayload(BaseModel):
    title: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    notes: Optional[str] = None


class MedicationPayload(BaseModel):
    name: Optional[str] = None
    dosage: Optional[str] = None
    times_per_day: Optional[int] = None
    duration_days: Optional[int] = None
    relation_to_meal: Optional[MealRelation] = None
    # Only set when the label states an actual clock time (e.g. "매일 오전 9시").
    # "HH:MM" 24h strings, one per dose. None when only meal-relative timing
    # ("식전"/"식후") was found — the client has to ask the user to pick a time then.
    specific_times: Optional[list[str]] = None
    notes: Optional[str] = None


class AnalyzeResponse(BaseModel):
    mock: bool
    category: Category
    confidence: float
    suggested_action: SuggestedAction
    contact: Optional[ContactPayload] = None
    calendar: Optional[CalendarPayload] = None
    medication: Optional[MedicationPayload] = None
    # True when the client must ask the user to pick/confirm a time before
    # saving (no exact time was found in the source — only a date, or only
    # meal-relative medication timing). False means it's safe to save as-is.
    needs_time_selection: bool = False
    # True when this category is paid (Tier 1) and the request couldn't be
    # fulfilled because the caller is a guest or doesn't have enough tokens —
    # category/confidence are still returned, but no fields were extracted.
    requires_tokens: bool = False
    raw_text: Optional[str] = None
    summary: Optional[str] = None
    # Which rung of the L0-L5 ladder actually produced this result (see
    # pricing.py's header) — "L2" (OCR only, no fields), "L3" (rule-based
    # extraction), "L5c" (Claude). None when nothing resolved yet (locked/
    # unsupported-filetype responses).
    resolved_layer: Optional[str] = None
