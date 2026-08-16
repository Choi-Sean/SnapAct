import { Share } from 'react-native';

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
 * just replays the same native write. Useful if the user deleted the result by hand. */
export async function replayAction(spec: ReplaySpec): Promise<void> {
  switch (spec.kind) {
    case 'business_card':
      await saveContact(spec.payload as ContactPayload);
      return;
    case 'event':
      await saveEventToCalendar(spec.payload as CalendarPayload);
      return;
    case 'reminder':
      await saveReminder(spec.payload as { title: string; notes?: string; dueDate?: Date });
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
      await composeMailDemo();
      return;
    case 'sms':
      await sendSmsDemo();
      return;
    case 'maps':
      await openMapsDemo();
      return;
    case 'files':
      await shareFileDemo();
      return;
    case 'wallet':
      await addToWalletDemo();
      return;
    case 'notification':
      await scheduleNotificationDemo();
      return;
  }
}
