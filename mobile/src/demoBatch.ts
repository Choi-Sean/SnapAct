import { AnalyzeResponse } from './types';

// A tiny transparent PNG reused as a stand-in thumbnail for every scripted
// batch-demo item — there's no real photo behind these, same as the other
// Quick Demo buttons which don't touch the camera or photo library either.
export const DEMO_BATCH_IMAGE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

function inDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

export function buildDemoBatchItems(rejectReason: string): { uri: string; result: AnalyzeResponse }[] {
  const results: AnalyzeResponse[] = [
    {
      mock: true,
      category: 'business_card',
      confidence: 0.94,
      suggested_action: 'contact',
      contact: { name: 'Jane Doe', phone: '+1 415-555-0142', email: 'jane.doe@northwind.io', company: 'Northwind Co.' },
    },
    {
      mock: true,
      category: 'event_flyer',
      confidence: 0.9,
      suggested_action: 'calendar',
      calendar: { title: 'Design Meetup', location: 'Startup Hub', start_date: inDays(2) },
    },
    {
      mock: true,
      category: 'receipt',
      confidence: 0.88,
      suggested_action: 'note',
      summary: 'Blue Bottle Coffee — $12.40, 2 items',
    },
    {
      mock: true,
      category: 'business_card',
      confidence: 0.92,
      suggested_action: 'contact',
      contact: { name: 'Mike Chen', phone: '+1 212-555-0199', email: 'mike@chenlaw.com', company: 'Chen & Partners' },
    },
    {
      mock: true,
      category: 'document',
      confidence: 0.81,
      suggested_action: 'note',
      summary: 'Lease agreement page 3 — signature required by Friday',
    },
    {
      mock: true,
      category: 'event_flyer',
      confidence: 0.87,
      suggested_action: 'calendar',
      calendar: { title: 'Product Launch Party', location: 'Rooftop Venue', start_date: inDays(5) },
    },
    {
      mock: true,
      category: 'receipt',
      confidence: 0.9,
      suggested_action: 'note',
      summary: 'Uber ride — $8.20',
    },
    {
      mock: true,
      category: 'business_card',
      confidence: 0.93,
      suggested_action: 'contact',
      contact: { name: 'Sara Kim', phone: '+82 10-1234-5678', email: 'sara.kim@studio.kr', company: 'Studio K' },
    },
    {
      mock: true,
      category: 'document',
      confidence: 0.8,
      suggested_action: 'note',
      summary: 'Whiteboard notes: Q3 roadmap ideas',
    },
    {
      mock: true,
      category: 'other',
      confidence: 0.21,
      suggested_action: 'none',
      summary: rejectReason,
    },
  ];
  return results.map((result) => ({ uri: DEMO_BATCH_IMAGE, result }));
}
