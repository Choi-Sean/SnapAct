import * as Calendar from 'expo-calendar';
import * as Contacts from 'expo-contacts';
import { Platform } from 'react-native';

import { CalendarPayload, ContactPayload } from './types';

export interface MedicationReminderSlot {
  hour: number;
  minute: number;
  // Fully composed by the caller (already in the user's selected language) —
  // this module doesn't own any locale strings itself.
  title: string;
  notes?: string;
}

async function getWritableCalendar(entityType: Calendar.EntityTypes): Promise<Calendar.ExpoCalendar> {
  if (entityType === Calendar.EntityTypes.REMINDER) {
    const { status } = await Calendar.requestRemindersPermissions();
    if (status !== 'granted') throw new Error('Reminders permission denied.');
  } else {
    const { status } = await Calendar.requestCalendarPermissions();
    if (status !== 'granted') throw new Error('Calendar permission denied.');
  }

  if (entityType === Calendar.EntityTypes.EVENT) {
    try {
      const def = Calendar.getDefaultCalendarSync();
      if (def) return def;
    } catch {
      // getDefaultCalendarSync is iOS-only; fall through on other platforms.
    }
  }

  const calendars = await Calendar.getCalendars(entityType);
  const writable = calendars.find((cal) => cal.allowsModifications);
  if (writable) return writable;

  const source =
    calendars.find((cal) => cal.source && cal.source.name === 'Default')?.source ??
    { isLocalAccount: true, name: 'Snapsist', type: Calendar.SourceType.LOCAL };

  return Calendar.createCalendar({
    title: 'Snapsist',
    color: '#2563eb',
    entityType,
    sourceId: (source as { id?: string }).id,
    source,
    name: 'snapsist',
    ownerAccount: 'snapsist',
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
  });
}

// ---- Calendar event: real saves use only the extracted fields; demo=true
// (playground showcase only) additionally exercises every decorative Event
// field, including a fake 4-week recurrence — never appropriate for a real
// user's actual event. ----
export async function saveEventToCalendar(payload: CalendarPayload, demo = false): Promise<string> {
  const calendar = await getWritableCalendar(Calendar.EntityTypes.EVENT);

  const startDate = payload.start_date ? new Date(payload.start_date) : new Date();
  const endDate = payload.end_date
    ? new Date(payload.end_date)
    : new Date(startDate.getTime() + 60 * 60 * 1000);

  const event = await calendar.createEvent(
    demo
      ? {
          title: payload.title ?? 'Snapsist event',
          startDate,
          endDate,
          allDay: false,
          location: payload.location ?? undefined,
          notes: payload.notes ?? undefined,
          url: 'https://example.com/snapsist-event',
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          availability: Calendar.Availability.BUSY,
          alarms: [{ relativeOffset: -15 }],
          recurrenceRule: { frequency: Calendar.Frequency.WEEKLY, interval: 1, occurrence: 4 },
        }
      : {
          title: payload.title || 'Snapsist event',
          startDate,
          endDate,
          allDay: false,
          location: payload.location || undefined,
          notes: payload.notes || undefined,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }
  );
  return event.id;
}

interface SaveContactOptions {
  // Playground showcase only — see saveEventToCalendar's comment.
  demo?: boolean;
  // Only used when demo is true.
  note?: string;
}

// ---- Contact: real saves write only the fields actually extracted from the
// photo. demo=true additionally exercises every CreateContactRecord field
// with filler data (fake middle name, birthday, address, relations, ...). ----
export async function saveContact(payload: ContactPayload, options: SaveContactOptions = {}): Promise<string> {
  const { demo = false, note } = options;
  const { status } = await Contacts.requestPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Contacts permission denied.');
  }

  const [firstName, ...rest] = (payload.name ?? 'New Contact').split(' ');
  const familyName = rest.join(' ') || undefined;

  const contact = await Contacts.Contact.create(
    demo
      ? {
          givenName: firstName,
          middleName: 'Andrew',
          familyName,
          prefix: 'Mr.',
          suffix: 'Jr.',
          company: payload.company ?? 'Snapsist Inc.',
          department: 'Engineering',
          jobTitle: payload.title ?? 'Product Manager',
          note,
          birthday: { year: 1990, month: 5, day: 12 },
          phones: payload.phone ? [{ label: 'mobile', number: payload.phone }] : undefined,
          emails: payload.email
            ? [{ label: 'work', address: payload.email }]
            : [{ label: 'work', address: 'john.smith@example.com' }],
          addresses: [
            { label: 'work', street: '123 Main St', city: 'San Francisco', state: 'CA', postcode: '94105', country: 'USA' },
          ],
          urlAddresses: [{ label: 'homepage', url: 'https://example.com' }],
          relations: [{ label: 'colleague', name: 'Jane Doe' }],
          socialProfiles: [{ label: 'Twitter', service: 'Twitter', username: 'johnsmith' }],
        }
      : {
          givenName: firstName,
          familyName,
          company: payload.company || undefined,
          jobTitle: payload.title || undefined,
          phones: payload.phone ? [{ label: 'mobile', number: payload.phone }] : undefined,
          emails: payload.email ? [{ label: 'work', address: payload.email }] : undefined,
        }
  );

  return contact.id;
}

interface ReminderPayload {
  title: string;
  notes?: string;
  dueDate?: Date;
}

// ---- Reminder: exercises every writable Reminder field (iOS only) when
// demo=true; real saves write only title/notes/dueDate. ----
export async function saveReminder(payload: ReminderPayload, demo = false): Promise<string | undefined> {
  if (Platform.OS !== 'ios') {
    throw new Error('미리 알림은 iOS에서만 지원돼요. Android에서는 캘린더를 이용해주세요.');
  }
  const calendar = await getWritableCalendar(Calendar.EntityTypes.REMINDER);

  const dueDate = payload.dueDate ?? new Date();

  const reminder = await calendar.createReminder(
    demo
      ? {
          title: payload.title,
          notes: payload.notes,
          location: 'Snapsist HQ',
          url: 'https://example.com/snapsist-reminder',
          startDate: new Date(),
          dueDate,
          completed: false,
          alarms: [{ relativeOffset: -10 }],
        }
      : {
          title: payload.title,
          notes: payload.notes,
          startDate: new Date(),
          dueDate,
          completed: false,
        }
  );
  return reminder.id;
}

// ---- Medication reminders: one recurring daily Reminder (iOS) / Event (Android)
// per dose-time slot, capped to exactly `durationDays` occurrences. Reminders
// (EKReminder) don't exist on Android, so Calendar events stand in there —
// same recurrenceRule mechanism already used by saveEventToCalendar. ----
export async function saveMedicationReminders(slots: MedicationReminderSlot[], durationDays: number): Promise<string[]> {
  const entityType = Platform.OS === 'ios' ? Calendar.EntityTypes.REMINDER : Calendar.EntityTypes.EVENT;
  const calendar = await getWritableCalendar(entityType);
  const recurrenceRule = { frequency: Calendar.Frequency.DAILY, interval: 1, occurrence: Math.max(1, durationDays) };
  const ids: string[] = [];

  for (const slot of slots) {
    const startDate = new Date();
    startDate.setHours(slot.hour, slot.minute, 0, 0);
    if (startDate.getTime() < Date.now()) startDate.setDate(startDate.getDate() + 1);

    if (Platform.OS === 'ios') {
      const reminder = await calendar.createReminder({
        title: slot.title,
        notes: slot.notes,
        startDate: new Date(),
        dueDate: startDate,
        completed: false,
        alarms: [{ relativeOffset: 0 }],
        recurrenceRule,
      });
      if (reminder.id) ids.push(reminder.id);
    } else {
      const event = await calendar.createEvent({
        title: slot.title,
        startDate,
        endDate: new Date(startDate.getTime() + 15 * 60 * 1000),
        allDay: false,
        notes: slot.notes,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        availability: Calendar.Availability.BUSY,
        alarms: [{ relativeOffset: 0 }],
        recurrenceRule,
      });
      ids.push(event.id);
    }
  }
  return ids;
}
