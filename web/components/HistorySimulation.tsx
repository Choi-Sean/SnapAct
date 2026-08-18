'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

import { Emoji, EmojiName } from '@/components/Emoji';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

interface Entry {
  id: string;
  icon: EmojiName;
  titleKo: string;
  titleEn: string;
  detailKo: string;
  detailEn: string;
  savedToKo: string;
  savedToEn: string;
  time: string;
  fields: { labelKo: string; labelEn: string; value: string }[];
  batch?: { labelKo: string; labelEn: string; count: number }[];
}

const ENTRIES: Entry[] = [
  {
    id: 'contact',
    icon: 'contacts',
    titleKo: 'Jane Doe',
    titleEn: 'Jane Doe',
    detailKo: '+1 415-555-0142',
    detailEn: '+1 415-555-0142',
    savedToKo: '연락처',
    savedToEn: 'Contacts',
    time: '2m',
    fields: [
      { labelKo: '이름', labelEn: 'Name', value: 'Jane Doe' },
      { labelKo: '휴대폰', labelEn: 'Mobile', value: '+1 415-555-0142' },
      { labelKo: '회사', labelEn: 'Company', value: 'Northwind Co.' },
    ],
  },
  {
    id: 'batch',
    icon: 'photos',
    titleKo: '12장 일괄 처리됨',
    titleEn: '12 photos processed',
    detailKo: '연락처 5 · 캘린더 3 · 메모 4',
    detailEn: 'Contacts 5 · Calendar 3 · Notes 4',
    savedToKo: '일괄 처리',
    savedToEn: 'Batch',
    time: '1h',
    fields: [],
    batch: [
      { labelKo: '연락처', labelEn: 'Contacts', count: 5 },
      { labelKo: '캘린더', labelEn: 'Calendar', count: 3 },
      { labelKo: '메모', labelEn: 'Notes', count: 4 },
    ],
  },
  {
    id: 'event',
    icon: 'calendar',
    titleKo: 'Design Meetup',
    titleEn: 'Design Meetup',
    detailKo: 'Startup Hub',
    detailEn: 'Startup Hub',
    savedToKo: '캘린더',
    savedToEn: 'Calendar',
    time: '3h',
    fields: [
      { labelKo: '제목', labelEn: 'Title', value: 'Design Meetup' },
      { labelKo: '장소', labelEn: 'Location', value: 'Startup Hub' },
      { labelKo: '시작', labelEn: 'Start', value: 'Tomorrow, 6:00 PM' },
    ],
  },
  {
    id: 'receipt',
    icon: 'notes',
    titleKo: '영수증',
    titleEn: 'Receipt',
    detailKo: '$8.30',
    detailEn: '$8.30',
    savedToKo: '공유',
    savedToEn: 'Shared',
    time: '5h',
    fields: [
      { labelKo: 'Americano', labelEn: 'Americano', value: '$4.50' },
      { labelKo: 'Croissant', labelEn: 'Croissant', value: '$3.80' },
      { labelKo: '합계', labelEn: 'Total', value: '$8.30' },
    ],
  },
  {
    id: 'medication',
    icon: 'reminders',
    titleKo: 'Amoxicillin 500mg',
    titleEn: 'Amoxicillin 500mg',
    detailKo: '1일 3회 · 식후',
    detailEn: '3x daily · after meals',
    savedToKo: '미리 알림',
    savedToEn: 'Reminders',
    time: '1d',
    fields: [
      { labelKo: '복용법', labelEn: 'Dosage', value: '1 tablet, 3x daily' },
      { labelKo: '기간', labelEn: 'Duration', value: '7 days' },
      { labelKo: '시간', labelEn: 'Timing', value: '8am · 12pm · 6pm' },
    ],
  },
];

export default function HistorySimulation() {
  const { locale } = useLanguage();
  const isKo = locale === 'ko';
  const [entries, setEntries] = useState(ENTRIES);
  const [openId, setOpenId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const open = entries.find((e) => e.id === openId) ?? null;

  function remove(id: string) {
    setRemovingId(id);
    setTimeout(() => {
      setEntries((prev) => prev.filter((e) => e.id !== id));
      setRemovingId(null);
      if (openId === id) setOpenId(null);
    }, 200);
  }

  return (
    <div className="mx-auto w-full max-w-sm overflow-hidden rounded-3xl border border-border bg-surface shadow-xl shadow-black/5">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <span className="text-[15px] font-extrabold">
          {open ? (isKo ? open.titleKo : open.titleEn) : isKo ? '기록' : 'History'}
        </span>
        <span className="text-xs font-semibold text-muted">
          {open ? '' : isKo ? `${entries.length}개` : `${entries.length} items`}
        </span>
      </div>

      <div className="relative min-h-[360px] overflow-hidden">
        {!open ? (
          <motion.ul
            key="list"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.22 }}
            className="divide-y divide-border"
          >
            {entries.map((entry) => (
              <li
                key={entry.id}
                className={`group relative flex items-center gap-3 overflow-hidden px-5 py-3.5 transition-all duration-200 ease-out ${
                  removingId === entry.id ? 'max-h-0 py-0 opacity-0' : 'max-h-20 opacity-100'
                }`}
              >
                <button onClick={() => setOpenId(entry.id)} className="flex flex-1 items-center gap-3 text-left">
                  <Emoji name={entry.icon} className="h-8 w-8 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-bold">
                      {isKo ? entry.titleKo : entry.titleEn}
                    </span>
                    <span className="block truncate text-[12px] text-muted">
                      {isKo ? entry.detailKo : entry.detailEn}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-[11px] font-bold text-accent">
                      {isKo ? entry.savedToKo : entry.savedToEn}
                    </span>
                    <span className="block text-[10.5px] text-muted">{entry.time}</span>
                  </span>
                </button>
                <button
                  aria-label={isKo ? '삭제' : 'Delete'}
                  onClick={() => remove(entry.id)}
                  className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted opacity-0 transition-opacity hover:bg-surface-alt hover:text-text group-hover:opacity-100"
                >
                  ✕
                </button>
              </li>
            ))}
            {entries.length === 0 && (
              <li className="px-5 py-10 text-center text-[13px] text-muted">
                {isKo ? '모두 지웠어요.' : "You've cleared everything."}
              </li>
            )}
          </motion.ul>
        ) : (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.22 }}
            className="px-5 py-4"
          >
              <button
                onClick={() => setOpenId(null)}
                className="mb-4 flex items-center gap-1 text-[12.5px] font-bold text-accent"
              >
                ← {isKo ? '기록으로' : 'Back to History'}
              </button>

              <div className="flex items-center gap-3 rounded-2xl bg-surface-alt p-4">
                <Emoji name={open.icon} className="h-10 w-10" />
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-extrabold">{isKo ? open.titleKo : open.titleEn}</p>
                  <p className="text-[11.5px] text-muted">
                    {isKo ? open.savedToKo : open.savedToEn} · {open.time} {isKo ? '전' : 'ago'}
                  </p>
                </div>
              </div>

              {open.batch ? (
                <ul className="mt-4 space-y-2">
                  {open.batch.map((b) => (
                    <li
                      key={b.labelKo}
                      className="flex items-center justify-between rounded-xl border border-border px-3.5 py-2.5 text-[13px]"
                    >
                      <span className="font-semibold">{isKo ? b.labelKo : b.labelEn}</span>
                      <span className="font-mono text-muted">{b.count}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-2 divide-y divide-border">
                  {open.fields.map((f) => (
                    <div key={f.labelEn} className="flex items-center justify-between py-2.5 text-[13px]">
                      <span className="font-semibold text-muted">{isKo ? f.labelKo : f.labelEn}</span>
                      <span className="font-mono text-text">{f.value}</span>
                    </div>
                  ))}
                </div>
              )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
