import type { IconName } from '@/components/icons';

export type Locale = 'en' | 'ko';

export interface Dictionary {
  meta: { title: string; description: string };
  nav: { features: string; how: string; integrations: string; cta: string };
  hero: {
    eyebrow: string;
    headline: string;
    headlineAccent: string;
    subheadline: string;
    ctaPrimary: string;
    ctaSecondary: string;
    mockCaption: string;
  };
  trust: { label: string; items: string[] };
  how: {
    eyebrow: string;
    headline: string;
    steps: { title: string; desc: string }[];
  };
  features: {
    eyebrow: string;
    headline: string;
    sub: string;
    items: { icon: IconName; title: string; desc: string; tag: string }[];
  };
  preview: {
    eyebrow: string;
    headline: string;
    sub: string;
    sourceLabel: string;
    destLabel: string;
    fields: { label: string; value: string }[];
    note: string;
    button: string;
  };
  why: {
    eyebrow: string;
    headline: string;
    items: { title: string; desc: string }[];
  };
  pipeline: {
    eyebrow: string;
    headline: string;
    sub: string;
    steps: { label: string; title: string; desc: string }[];
  };
  faq: {
    eyebrow: string;
    headline: string;
    items: { q: string; a: string }[];
  };
  cta: {
    headline: string;
    sub: string;
    button: string;
    note: string;
  };
  footer: {
    tagline: string;
    rights: string;
  };
}

export const dictionaries: Record<Locale, Dictionary> = {
  en: {
    meta: {
      title: 'Snapsist — One photo, filed automatically',
      description:
        'Snapsist reads a photo of a business card, receipt, event flyer, or to-do and files it straight into Contacts, Calendar, Reminders, Wallet, and more — no typing.',
    },
    nav: { features: 'Integrations', how: 'How it works', integrations: 'Integrations', cta: 'Get the app' },
    hero: {
      eyebrow: 'Photo → Contacts, Calendar, Wallet & more',
      headline: 'Snap it once.',
      headlineAccent: 'It files itself.',
      subheadline:
        'Point your camera at a business card, receipt, flyer, or sticky note. Snapsist reads it and writes it straight into the apps already on your phone — Contacts, Calendar, Reminders, Wallet, Mail — no copying, no retyping.',
      ctaPrimary: 'Get on TestFlight',
      ctaSecondary: 'See how it works',
      mockCaption: 'Every field shown before it saves — nothing happens silently.',
    },
    trust: {
      label: 'Built entirely on-device integrations',
      items: ['Contacts', 'Calendar', 'Reminders', 'Wallet', 'Mail', 'Files'],
    },
    how: {
      eyebrow: 'How it works',
      headline: 'Three steps. Zero typing.',
      steps: [
        {
          title: 'Snap',
          desc: 'Take a photo or pick one from your library — a business card, receipt, flyer, whatever needs saving.',
        },
        {
          title: 'Read',
          desc: 'Google Vision classifies the photo, then Claude extracts every field — names, dates, amounts, addresses.',
        },
        {
          title: 'File',
          desc: 'Review the exact fields about to be written, then save straight into the right native app on your phone.',
        },
      ],
    },
    features: {
      eyebrow: 'Integrations',
      headline: 'It writes to the apps you already trust',
      sub: 'Every integration uses the real, native framework for that app — not a copy, not a workaround.',
      items: [
        { icon: 'contacts', title: 'Contacts', desc: 'Full name, company, title, phones, emails, addresses, birthday, socials.', tag: 'Fully automatic' },
        { icon: 'calendar', title: 'Calendar', desc: 'Title, time, location, alerts, recurrence — a real event, not a note.', tag: 'Fully automatic' },
        { icon: 'reminders', title: 'Reminders', desc: 'To-dos with due dates, locations, and alerts on iOS.', tag: 'Fully automatic' },
        { icon: 'photos', title: 'Photos', desc: 'Saved straight into an album, ready when you need it.', tag: 'Fully automatic' },
        { icon: 'wallet', title: 'Apple Wallet', desc: 'Signed, scannable passes added straight to Wallet.', tag: 'Fully automatic' },
        { icon: 'mail', title: 'Mail & Messages', desc: 'A draft appears pre-filled, ready for one tap to send.', tag: 'One tap to send' },
        { icon: 'notes', title: 'Notes', desc: 'Formatted and handed to Notes through the share sheet.', tag: 'One tap to file' },
        { icon: 'maps', title: 'Maps', desc: 'Opens the address straight in Apple or Google Maps.', tag: 'Opens instantly' },
      ],
    },
    preview: {
      eyebrow: 'No surprises',
      headline: 'You see every field before anything is saved',
      sub: 'Snapsist never writes silently. Every button opens a review screen listing exactly what will be written — edit what matters, then confirm.',
      sourceLabel: 'Business Card',
      destLabel: 'Contacts',
      fields: [
        { label: 'First / Last Name', value: 'John / Smith' },
        { label: 'Mobile', value: '+1 123-456-7894' },
        { label: 'Work Email', value: 'john.smith@example.com' },
        { label: 'Company / Title', value: 'Snapsist Inc. / Product Manager' },
        { label: 'Address', value: '123 Main St, San Francisco, CA' },
      ],
      note: 'This is the actual review screen from the app — nothing hidden, nothing simplified.',
      button: 'Save to Contacts',
    },
    why: {
      eyebrow: 'Why Snapsist',
      headline: 'Automation that stays on your terms',
      items: [
        {
          title: 'Nothing leaves your phone by default',
          desc: 'Every save writes directly to a native framework on-device. No account required to use the core features.',
        },
        {
          title: 'You approve every write',
          desc: 'A review screen shows the exact fields before anything touches Contacts, Calendar, or Wallet.',
        },
        {
          title: 'Real integrations, not workarounds',
          desc: 'EventKit for Calendar and Reminders, CNContactStore for Contacts, PassKit for Wallet — the same frameworks Apple’s own apps use.',
        },
      ],
    },
    pipeline: {
      eyebrow: 'Under the hood',
      headline: 'Built to be cheap and accurate, not just impressive',
      sub: 'Every photo runs through a two-model pipeline designed so you never pay for more inference than the photo actually needs.',
      steps: [
        {
          label: '01',
          title: 'Google Vision classifies first',
          desc: 'A fast, inexpensive pass reads the photo’s labels and any visible text to work out what kind of thing it is.',
        },
        {
          label: '02',
          title: 'Nothing useful? It stops right there',
          desc: 'If Vision doesn’t recognize a business card, receipt, event, or document, Snapsist skips the expensive model entirely — no wasted call.',
        },
        {
          label: '03',
          title: 'Claude reads only what it needs to',
          desc: 'Text-heavy photos (receipts, documents) send Claude the extracted text, not the image — far cheaper than image tokens. Visual layout (business cards, flyers) sends the real image.',
        },
      ],
    },
    faq: {
      eyebrow: 'FAQ',
      headline: 'Questions people actually ask',
      items: [
        {
          q: 'Do I need to create an account?',
          a: 'No. Snapsist writes directly to native frameworks already on your phone — Contacts, Calendar, Reminders, Wallet. There’s no account system for the core features.',
        },
        {
          q: 'Does my photo get stored anywhere?',
          a: 'Your photo is sent once for analysis and discarded immediately after — Snapsist’s backend doesn’t keep a copy or a history of what you’ve scanned.',
        },
        {
          q: 'What if Snapsist gets a field wrong?',
          a: 'Every save opens a review screen first, listing the exact fields about to be written. Edit anything, or cancel — nothing is saved until you confirm.',
        },
        {
          q: 'Why does Snapsist open a share sheet for Notes instead of saving directly?',
          a: 'Apple and Google don’t provide a public API for their Notes / Keep apps, so there’s no way for any third-party app to write into them directly. Snapsist hands off a formatted note through the share sheet instead — one tap instead of zero, which is the most it’s technically possible to automate.',
        },
        {
          q: 'Is it available on Android?',
          a: 'Snapsist is iOS-only for now, in TestFlight. Reminders and Apple Wallet are iOS-specific frameworks either way, so those two would stay iOS-only even with an Android build.',
        },
        {
          q: 'What does it cost?',
          a: 'Free during the beta. Pricing after that hasn’t been decided yet.',
        },
      ],
    },
    cta: {
      headline: 'Stop retyping what a photo already says.',
      sub: 'Snapsist is in testing now — join TestFlight to try it before anyone else.',
      button: 'Get on TestFlight',
      note: 'iOS · Free during beta',
    },
    footer: {
      tagline: 'One photo. Every app, updated automatically.',
      rights: 'All rights reserved.',
    },
  },
  ko: {
    meta: {
      title: 'Snapsist — 사진 한 장이면 자동으로 정리됩니다',
      description:
        'Snapsist는 명함, 영수증, 이벤트 전단지, 할 일 메모를 사진으로 찍으면 읽어서 연락처·캘린더·미리 알림·Wallet 등에 바로 정리해줍니다. 타이핑 필요 없어요.',
    },
    nav: { features: '연동 기능', how: '작동 방식', integrations: '연동 기능', cta: '앱 받기' },
    hero: {
      eyebrow: '사진 → 연락처, 캘린더, Wallet 등 자동 연동',
      headline: '한 번 찍으면,',
      headlineAccent: '알아서 정리됩니다.',
      subheadline:
        '명함, 영수증, 전단지, 메모지에 카메라를 갖다 대세요. Snapsist가 읽어서 이미 쓰고 있는 앱 — 연락처, 캘린더, 미리 알림, Wallet, 메일 — 에 바로 써줍니다. 복사도, 재입력도 필요 없어요.',
      ctaPrimary: 'TestFlight로 받기',
      ctaSecondary: '작동 방식 보기',
      mockCaption: '저장되기 전 모든 항목을 보여줍니다 — 조용히 처리되는 건 없어요.',
    },
    trust: {
      label: '전부 기기 내장 연동으로 동작합니다',
      items: ['연락처', '캘린더', '미리 알림', 'Wallet', '메일', '파일'],
    },
    how: {
      eyebrow: '작동 방식',
      headline: '세 단계, 타이핑은 0번',
      steps: [
        { title: '촬영', desc: '명함, 영수증, 전단지 등 저장이 필요한 걸 사진으로 찍거나 갤러리에서 선택하세요.' },
        { title: '인식', desc: 'Google Vision이 사진을 분류하고, Claude가 이름·날짜·금액·주소 등 모든 정보를 추출합니다.' },
        { title: '정리', desc: '저장될 항목을 정확히 확인한 뒤, 알맞은 기기 앱에 바로 저장합니다.' },
      ],
    },
    features: {
      eyebrow: '연동 기능',
      headline: '이미 쓰고 있는 앱에 바로 써줍니다',
      sub: '모든 연동은 실제 네이티브 프레임워크를 사용합니다 — 복사본도, 우회 방식도 아닙니다.',
      items: [
        { icon: 'contacts', title: '연락처', desc: '이름, 회사, 직함, 전화, 이메일, 주소, 생일, SNS까지.', tag: '완전 자동' },
        { icon: 'calendar', title: '캘린더', desc: '제목, 시간, 장소, 알림, 반복까지 — 진짜 일정으로 등록됩니다.', tag: '완전 자동' },
        { icon: 'reminders', title: '미리 알림', desc: '마감일·장소·알림이 있는 할 일 (iOS).', tag: '완전 자동' },
        { icon: 'photos', title: '사진', desc: '앨범에 바로 저장돼서 필요할 때 바로 찾을 수 있어요.', tag: '완전 자동' },
        { icon: 'wallet', title: 'Apple Wallet', desc: '서명된 패스를 Wallet에 바로 추가합니다.', tag: '완전 자동' },
        { icon: 'mail', title: '메일 · 문자', desc: '내용이 채워진 초안이 뜨고, 탭 한 번이면 전송됩니다.', tag: '한 번 탭' },
        { icon: 'notes', title: '메모', desc: '정리된 형태로 공유 시트를 통해 메모 앱으로 전달됩니다.', tag: '한 번 탭' },
        { icon: 'maps', title: '지도', desc: '주소를 Apple/Google 지도에서 바로 열어줍니다.', tag: '즉시 열림' },
      ],
    },
    preview: {
      eyebrow: '숨기는 거 없음',
      headline: '저장 전에 모든 항목을 먼저 보여줍니다',
      sub: 'Snapsist는 조용히 저장하지 않습니다. 버튼을 누르면 실제로 저장될 값을 전부 나열한 확인 화면이 뜨고, 필요한 건 수정한 뒤 확인을 눌러야 저장됩니다.',
      sourceLabel: '명함',
      destLabel: '연락처',
      fields: [
        { label: '이름 / 성', value: 'John / Smith' },
        { label: '휴대폰', value: '+1 123-456-7894' },
        { label: '직장 이메일', value: 'john.smith@example.com' },
        { label: '회사 / 직함', value: 'Snapsist Inc. / Product Manager' },
        { label: '주소', value: '123 Main St, San Francisco, CA' },
      ],
      note: '실제 앱의 확인 화면입니다 — 감춘 것도, 단순화한 것도 없습니다.',
      button: '연락처에 저장',
    },
    why: {
      eyebrow: 'Snapsist를 쓰는 이유',
      headline: '자동화의 주도권은 사용자에게 있습니다',
      items: [
        { title: '기본적으로 기기 밖으로 안 나갑니다', desc: '모든 저장은 기기 내장 프레임워크로 바로 기록됩니다. 핵심 기능은 계정 없이도 사용 가능합니다.' },
        { title: '모든 저장은 사용자가 승인합니다', desc: '연락처·캘린더·Wallet에 뭔가 쓰이기 전에, 정확히 어떤 값이 들어갈지 확인 화면에서 보여줍니다.' },
        { title: '진짜 연동입니다, 우회가 아니라', desc: '캘린더·미리 알림엔 EventKit, 연락처엔 CNContactStore, Wallet엔 PassKit — Apple 기본 앱들과 똑같은 프레임워크를 씁니다.' },
      ],
    },
    pipeline: {
      eyebrow: '내부 동작 원리',
      headline: '멋있어 보이려고가 아니라, 저렴하고 정확하려고 만든 구조',
      sub: '모든 사진은 2단계 모델 파이프라인을 거칩니다 — 사진에 필요한 만큼만 추론 비용을 쓰도록 설계했어요.',
      steps: [
        { label: '01', title: 'Google Vision이 먼저 분류합니다', desc: '빠르고 저렴한 1차 패스로 사진의 라벨과 보이는 텍스트를 읽어서 어떤 종류인지 판단합니다.' },
        { label: '02', title: '쓸 만한 게 없으면 거기서 멈춥니다', desc: '명함·영수증·이벤트·문서 중 아무것도 인식 못 하면, 비싼 모델(Claude)은 아예 호출하지 않습니다 — 낭비 없음.' },
        { label: '03', title: 'Claude는 필요한 만큼만 읽습니다', desc: '텍스트 위주 사진(영수증, 문서)은 이미지 대신 추출된 텍스트만 Claude에 보냅니다 — 이미지 토큰보다 훨씬 저렴해요. 레이아웃이 중요한 것(명함, 전단지)은 실제 이미지를 보냅니다.' },
      ],
    },
    faq: {
      eyebrow: 'FAQ',
      headline: '실제로 많이 물어보시는 것들',
      items: [
        { q: '계정을 만들어야 하나요?', a: '아니요. Snapsist는 이미 휴대폰에 있는 네이티브 프레임워크(연락처, 캘린더, 미리 알림, Wallet)에 바로 씁니다. 핵심 기능엔 계정 시스템 자체가 없어요.' },
        { q: '제 사진이 어딘가에 저장되나요?', a: '사진은 분석을 위해 한 번 전송되고 즉시 폐기됩니다 — Snapsist 백엔드는 스캔한 사진의 사본이나 기록을 보관하지 않습니다.' },
        { q: '항목을 잘못 인식하면 어떡하죠?', a: '저장 전에 항상 확인 화면이 먼저 뜨고, 실제로 저장될 항목을 정확히 보여줍니다. 뭐든 수정하거나 취소할 수 있고, 확인을 누르기 전엔 아무것도 저장되지 않아요.' },
        { q: '왜 메모는 바로 저장 안 하고 공유 시트를 여나요?', a: 'Apple과 Google 둘 다 Notes/Keep 앱에 쓸 수 있는 공개 API를 제공하지 않아서, 어떤 서드파티 앱도 직접 쓸 방법이 없어요. 그래서 Snapsist는 정리된 메모를 공유 시트로 넘겨줍니다 — 탭 0번이 아니라 1번이지만, 기술적으로 가능한 최선입니다.' },
        { q: 'Android도 지원하나요?', a: '지금은 iOS 전용(TestFlight 베타)입니다. 미리 알림과 Apple Wallet은 애초에 iOS 전용 프레임워크라, Android 버전이 나와도 이 두 개는 계속 iOS에서만 됩니다.' },
        { q: '비용은요?', a: '베타 기간엔 무료입니다. 이후 요금제는 아직 정해지지 않았어요.' },
      ],
    },
    cta: {
      headline: '사진에 이미 적힌 걸 다시 타이핑하지 마세요.',
      sub: 'Snapsist는 지금 테스트 중입니다 — TestFlight로 가장 먼저 써보세요.',
      button: 'TestFlight로 받기',
      note: 'iOS · 베타 기간 무료',
    },
    footer: {
      tagline: '사진 한 장이면, 모든 앱이 자동으로 업데이트됩니다.',
      rights: 'All rights reserved.',
    },
  },
};
