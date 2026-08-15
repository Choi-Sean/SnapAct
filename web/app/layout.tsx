import type { Metadata } from 'next';
import { IBM_Plex_Mono, Manrope } from 'next/font/google';

import { LanguageProvider } from '@/lib/i18n/LanguageProvider';

import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  weight: ['400', '500', '700', '800'],
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'Snapsist — One photo, filed automatically',
  description:
    'Snapsist reads a photo of a business card, receipt, event flyer, or to-do and files it straight into Contacts, Calendar, Reminders, Wallet, and more — no typing.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${plexMono.variable}`}>
      <body className="font-sans antialiased">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
