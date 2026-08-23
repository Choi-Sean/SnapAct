import { Image, ImageStyle, StyleProp } from 'react-native';

export type EmojiName =
  | 'contacts'
  | 'calendar'
  | 'reminders'
  | 'photos'
  | 'wallet'
  | 'mail'
  | 'notes'
  | 'maps'
  | 'camera'
  | 'sms'
  | 'files'
  | 'notification';

const SOURCES: Record<EmojiName, number> = {
  contacts: require('../assets/emoji/contacts.png'),
  calendar: require('../assets/emoji/calendar.png'),
  reminders: require('../assets/emoji/reminders.png'),
  photos: require('../assets/emoji/photos.png'),
  wallet: require('../assets/emoji/wallet.png'),
  mail: require('../assets/emoji/mail.png'),
  notes: require('../assets/emoji/notes.png'),
  maps: require('../assets/emoji/maps.png'),
  camera: require('../assets/emoji/camera.png'),
  sms: require('../assets/emoji/sms.png'),
  files: require('../assets/emoji/files.png'),
  notification: require('../assets/emoji/notification.png'),
};

export function Emoji({ name, size = 28, style }: { name: EmojiName; size?: number; style?: StyleProp<ImageStyle> }) {
  return <Image source={SOURCES[name]} style={[{ width: size, height: size }, style]} resizeMode="contain" />;
}
