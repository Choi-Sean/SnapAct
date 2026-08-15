from typing import Literal, Optional

from pydantic import BaseModel

Category = Literal["business_card", "receipt", "event_flyer", "document", "other"]
SuggestedAction = Literal["contact", "calendar", "note", "none"]


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


class AnalyzeResponse(BaseModel):
    mock: bool
    category: Category
    confidence: float
    suggested_action: SuggestedAction
    contact: Optional[ContactPayload] = None
    calendar: Optional[CalendarPayload] = None
    raw_text: Optional[str] = None
    summary: Optional[str] = None
