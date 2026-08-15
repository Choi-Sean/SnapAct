import * as Calendar from 'expo-calendar';
import * as Contacts from 'expo-contacts';
import * as ImagePicker from 'expo-image-picker';

export async function requestAllPermissions(): Promise<void> {
  const steps = [
    () => ImagePicker.requestCameraPermissionsAsync(),
    () => ImagePicker.requestMediaLibraryPermissionsAsync(),
    () => Contacts.requestPermissionsAsync(),
    () => Calendar.requestCalendarPermissions(),
    () => Calendar.requestRemindersPermissions(),
  ];

  for (const step of steps) {
    try {
      await step();
    } catch {
      // Ignore individual failures (e.g. reminders unsupported on Android) so
      // one denial/error doesn't block the rest of the onboarding sequence.
    }
  }
}
