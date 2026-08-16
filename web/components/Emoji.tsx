// Colorful emoji graphics via Twemoji SVGs (self-hosted in public/emoji/), so they
// render identically everywhere instead of depending on the OS's emoji font.
export type EmojiName = 'contacts' | 'calendar' | 'reminders' | 'photos' | 'wallet' | 'mail' | 'notes' | 'maps';

export function Emoji({ name, className }: { name: EmojiName; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/emoji/${name}.svg`} alt="" className={className} draggable={false} />;
}
