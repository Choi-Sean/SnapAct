import { Share } from 'react-native';

import { Dictionary } from './i18n/dictionaries';
import {
  addToWalletDemo,
  composeMailDemo,
  openMapsDemo,
  saveContact,
  saveEventToCalendar,
  savePhotoDemo,
  saveReminder,
  scheduleNotificationDemo,
  sendSmsDemo,
  shareFileDemo,
} from './nativeActions';
import { CalendarPayload, ContactPayload, ReplaySpec } from './types';

/** Re-runs a previously saved action with its original payload — no new AI call,
 * just replays the same native write. Useful if the user deleted the result by hand.
 * Takes the current Dictionary so replayed content matches whatever language is
 * selected now, not whatever was selected when the item was first saved. */
export async function replayAction(spec: ReplaySpec, t: Dictionary): Promise<void> {
  const d = t.review.demo;
  switch (spec.kind) {
    case 'business_card':
      await saveContact(spec.payload as ContactPayload, spec.demo ? { demo: true, note: d.contactNote } : undefined);
      return;
    case 'event':
      await saveEventToCalendar(spec.payload as CalendarPayload, spec.demo);
      return;
    case 'reminder':
      await saveReminder(spec.payload as { title: string; notes?: string; dueDate?: Date }, spec.demo);
      return;
    case 'receipt': {
      const { message, title } = spec.payload as { message: string; title: string };
      await Share.share({ message, title });
      return;
    }
    case 'photo':
      await savePhotoDemo();
      return;
    case 'mail':
      await composeMailDemo(d.mailSubjectDefault, d.mailBodyContent);
      return;
    case 'sms':
      await sendSmsDemo(d.smsMessageDefault);
      return;
    case 'maps':
      await openMapsDemo();
      return;
    case 'files':
      await shareFileDemo(d.filesContentPrefix, d.filesShareDialogTitle);
      return;
    case 'wallet':
      await addToWalletDemo(d.walletShareDialogTitle);
      return;
    case 'notification':
      await scheduleNotificationDemo(d.notificationSubtitleDefault, d.notificationBody);
      return;
  }
}
