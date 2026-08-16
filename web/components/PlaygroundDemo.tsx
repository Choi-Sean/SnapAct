'use client';

import { useState } from 'react';

import { Emoji, EmojiName } from '@/components/Emoji';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

type DemoKey = 'contacts' | 'calendar' | 'notes' | 'reminders' | 'wallet' | 'maps' | 'mail';

interface DemoDef {
  icon: EmojiName;
  labelKo: string;
  labelEn: string;
  destKo: string;
  destEn: string;
  fields: { label: string; value: string }[];
  buttonKo: string;
  buttonEn: string;
}

const DEMOS: Record<DemoKey, DemoDef> = {
  contacts: {
    icon: 'contacts',
    labelKo: '명함 사진',
    labelEn: 'Business card',
    destKo: '연락처',
    destEn: 'Contacts',
    fields: [
      { label: 'Name', value: 'John Smith' },
      { label: 'Mobile', value: '+1 123-456-7894' },
      { label: 'Company', value: 'Snapsist Inc.' },
    ],
    buttonKo: '연락처에 저장',
    buttonEn: 'Save to Contacts',
  },
  calendar: {
    icon: 'calendar',
    labelKo: '이벤트 사진',
    labelEn: 'Event flyer',
    destKo: '캘린더',
    destEn: 'Calendar',
    fields: [
      { label: 'Title', value: 'Snapsist Demo Event' },
      { label: 'Date', value: 'Today, 6:00 PM' },
      { label: 'Location', value: 'Snapsist HQ' },
    ],
    buttonKo: '캘린더에 저장',
    buttonEn: 'Save to Calendar',
  },
  notes: {
    icon: 'notes',
    labelKo: '영수증 사진',
    labelEn: 'Receipt',
    destKo: '메모',
    destEn: 'Notes',
    fields: [
      { label: 'Americano', value: '$4.50' },
      { label: 'Croissant', value: '$3.80' },
      { label: 'Total', value: '$8.30' },
    ],
    buttonKo: '메모로 공유',
    buttonEn: 'Share to Notes',
  },
  reminders: {
    icon: 'reminders',
    labelKo: '할 일 메모',
    labelEn: 'To-do note',
    destKo: '미리 알림',
    destEn: 'Reminders',
    fields: [
      { label: 'Task', value: 'Buy milk' },
      { label: 'Due', value: 'Today' },
    ],
    buttonKo: '미리 알림에 저장',
    buttonEn: 'Save to Reminders',
  },
  wallet: {
    icon: 'wallet',
    labelKo: '패스/티켓',
    labelEn: 'Pass / ticket',
    destKo: 'Apple Wallet',
    destEn: 'Apple Wallet',
    fields: [
      { label: 'Type', value: 'Event Ticket' },
      { label: 'Holder', value: 'John Smith' },
    ],
    buttonKo: 'Wallet에 추가',
    buttonEn: 'Add to Wallet',
  },
  maps: {
    icon: 'maps',
    labelKo: '주소가 적힌 사진',
    labelEn: 'Photo with an address',
    destKo: '지도',
    destEn: 'Maps',
    fields: [{ label: 'Address', value: '123 Main St, San Francisco, CA' }],
    buttonKo: '지도에서 열기',
    buttonEn: 'Open in Maps',
  },
  mail: {
    icon: 'mail',
    labelKo: '연락처가 적힌 사진',
    labelEn: 'Photo with contact info',
    destKo: '메일',
    destEn: 'Mail',
    fields: [
      { label: 'To', value: 'demo@example.com' },
      { label: 'Subject', value: 'Snapsist Demo' },
    ],
    buttonKo: '메일 초안 열기',
    buttonEn: 'Open mail draft',
  },
};

const ORDER: DemoKey[] = ['contacts', 'calendar', 'notes', 'reminders', 'wallet', 'maps', 'mail'];

export default function PlaygroundDemo() {
  const { locale } = useLanguage();
  const isKo = locale === 'ko';
  const [active, setActive] = useState<DemoKey | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  function open(key: DemoKey) {
    setActive(key);
    setSaved(false);
  }

  function close() {
    setActive(null);
    setSaved(false);
  }

  function handleSave() {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
    }, 650);
  }

  const demo = active ? DEMOS[active] : null;

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ORDER.map((key) => {
          const d = DEMOS[key];
          return (
            <button
              key={key}
              onClick={() => open(key)}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-5 text-center transition-transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5"
            >
              <Emoji name={d.icon} className="h-9 w-9" />
              <span className="text-[13px] font-bold">{isKo ? d.labelKo : d.labelEn}</span>
              <span className="text-[11px] text-muted">→ {isKo ? d.destKo : d.destEn}</span>
            </button>
          );
        })}
      </div>

      {demo && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center" onClick={close}>
          <div
            className="w-full max-w-sm rounded-t-3xl bg-surface p-6 shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {!saved ? (
              <>
                <div className="flex items-center gap-3">
                  <Emoji name={demo.icon} className="h-9 w-9" />
                  <div>
                    <p className="text-[15px] font-extrabold">
                      {isKo ? demo.labelKo : demo.labelEn} → {isKo ? demo.destKo : demo.destEn}
                    </p>
                    <p className="text-[11.5px] text-muted">
                      {isKo ? '저장 전 확인 화면입니다' : 'Review before saving'}
                    </p>
                  </div>
                </div>

                <div className="mt-5 divide-y divide-border">
                  {demo.fields.map((f) => (
                    <div key={f.label} className="flex items-center justify-between py-2.5 text-[13px]">
                      <span className="font-semibold text-muted">{f.label}</span>
                      <span className="font-mono text-text">{f.value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={close}
                    className="flex-1 rounded-xl bg-surface-alt py-3 text-sm font-bold text-muted"
                  >
                    {isKo ? '취소' : 'Cancel'}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 rounded-xl bg-accent py-3 text-sm font-bold text-white disabled:opacity-60"
                  >
                    {saving ? (isKo ? '저장 중...' : 'Saving...') : isKo ? demo.buttonKo : demo.buttonEn}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-good/10 text-3xl">✅</span>
                <p className="text-[15px] font-extrabold">
                  {isKo ? `${isKo ? demo.destKo : demo.destEn}에 저장됐어요` : `Saved to ${demo.destEn}`}
                </p>
                <p className="max-w-[26ch] text-[12.5px] text-muted">
                  {isKo
                    ? '이건 웹 데모라 실제로 저장되진 않아요. 실제 앱에서는 진짜 iPhone 앱에 저장됩니다.'
                    : "This is a web demo, so nothing was really saved. In the real app, this writes to your actual iPhone app."}
                </p>
                <button onClick={close} className="mt-2 rounded-full bg-accent px-6 py-2.5 text-sm font-bold text-white">
                  {isKo ? '다른 것도 눌러보기' : 'Try another one'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
