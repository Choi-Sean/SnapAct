import type { EmojiName } from '@/components/Emoji';

export type Locale = 'en' | 'ko' | 'ja' | 'zh' | 'es' | 'fr' | 'de';

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  ko: '한국어',
  ja: '日本語',
  zh: '中文',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
};

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
    ways: { icon: string; title: string; desc: string }[];
  };
  features: {
    eyebrow: string;
    headline: string;
    sub: string;
    items: { icon: EmojiName; title: string; desc: string; tag: string; platforms: ('ios' | 'android')[] }[];
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
        'Snapsist reads a photo of a business card, receipt, event flyer, or medication label and files it straight into Contacts, Calendar, or Reminders — no typing. Wallet, Mail, and Maps are also built in — try them in the app.',
    },
    nav: { features: 'Integrations', how: 'How it works', integrations: 'Integrations', cta: 'Get the app' },
    hero: {
      eyebrow: 'Photo → Contacts, Calendar, Wallet & more',
      headline: 'Snap it once.',
      headlineAccent: 'It files itself.',
      subheadline:
        'Point your camera at a business card, receipt, flyer, or medication label. Snapsist reads it and writes it straight into Contacts, Calendar, or Reminders — no copying, no retyping. Wallet, Mail, and Maps are built in too — try them in the app.',
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
          title: 'AI reads it for you',
          desc: 'It figures out what kind of thing it’s looking at and pulls out the details — names, dates, amounts, addresses — automatically.',
        },
        {
          title: 'It saves itself',
          desc: 'Check the details, tap once, and it’s already in the right app on your phone — no exporting, no copy-paste.',
        },
      ],
      ways: [
        {
          icon: '📤',
          title: 'Share from Photos',
          desc: 'Tap Share on any photo, pick Snapsist, and analysis starts instantly — no need to even open the app first.',
        },
        {
          icon: '📸',
          title: 'Snap or pick in the app',
          desc: 'Open Snapsist, take a photo or choose one from your library, and it reads it the same way.',
        },
      ],
    },
    features: {
      eyebrow: 'Integrations',
      headline: 'It writes to the apps you already trust',
      sub: 'Contacts, Calendar, and Reminders save straight from what you photograph. The rest are real, working integrations too — try them in the app’s built-in demo.',
      items: [
        { icon: 'contacts', title: 'Contacts', desc: 'Full name, company, title, phones, emails, addresses, birthday, socials.', tag: 'Fully automatic', platforms: ['ios', 'android'] },
        { icon: 'calendar', title: 'Calendar', desc: 'Title, time, location, alerts, recurrence — a real event, not a note.', tag: 'Fully automatic', platforms: ['ios', 'android'] },
        { icon: 'reminders', title: 'Reminders', desc: 'Medication schedules and to-dos, with due dates, locations, and alerts on iOS.', tag: 'Fully automatic', platforms: ['ios'] },
        { icon: 'photos', title: 'Photos', desc: 'Saved straight into an album, ready when you need it.', tag: 'Try it in the demo', platforms: ['ios', 'android'] },
        { icon: 'wallet', title: 'Apple Wallet', desc: 'Signed, scannable passes added straight to Wallet.', tag: 'Try it in the demo', platforms: ['ios'] },
        { icon: 'mail', title: 'Mail & Messages', desc: 'A draft appears pre-filled, ready for one tap to send.', tag: 'Try it in the demo', platforms: ['ios', 'android'] },
        { icon: 'notes', title: 'Notes', desc: 'Formatted and handed to Notes through the share sheet when you batch-process photos.', tag: 'One tap to file', platforms: ['ios', 'android'] },
        { icon: 'maps', title: 'Maps', desc: 'Opens the address straight in Apple or Google Maps.', tag: 'Try it in the demo', platforms: ['ios', 'android'] },
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
          desc: 'Every save writes directly to the app on your device. No account required to use the core features.',
        },
        {
          title: 'You approve every write',
          desc: 'A review screen shows the exact fields before anything touches Contacts, Calendar, or Wallet.',
        },
        {
          title: 'Real integrations, not workarounds',
          desc: 'Snapsist saves through the exact same official channel Apple’s own Contacts, Calendar, and Wallet apps use — not a copy, not a trick.',
        },
      ],
    },
    faq: {
      eyebrow: 'FAQ',
      headline: 'Questions people actually ask',
      items: [
        {
          q: 'Do I need to create an account?',
          a: 'No — the core features (Contacts, Calendar, Reminders) work without one, and you can try Wallet, Mail, and Maps in the app’s demo either way. Creating a free account gets you 50 starter tokens and a web dashboard with synced history.',
        },
        {
          q: 'Does my photo get stored anywhere?',
          a: 'No — your photo is sent for analysis and discarded immediately after; we never store a copy. It stays on your own device, in the app’s local history. If you’re signed in, we save the extracted result (category, summary) to your account so you can see it on the web dashboard — but never the picture itself.',
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
          a: 'An Android build is in development — right now you can join the iOS TestFlight. Reminders and Apple Wallet are iOS-specific frameworks either way, so those two will stay iOS-only even once Android ships.',
        },
        {
          q: 'What does it cost?',
          a: 'Medication, documents, and unrecognized photos are always free. Business cards, receipts, and event flyers use tokens — 10 tokens per analysis. New accounts get 50 free tokens; more can be bought in packs starting at $2.99.',
        },
        {
          q: 'Do my tokens expire?',
          a: 'No — buy them once and use them whenever you like. There’s no subscription to cancel or forget about.',
        },
        {
          q: 'Can I delete my account?',
          a: 'Yes. Settings has a Delete Account option that permanently removes your account and its data right away — no support ticket needed.',
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
        'Snapsist는 명함, 영수증, 이벤트 전단지, 약봉투를 사진으로 찍으면 읽어서 연락처·캘린더·미리 알림에 바로 정리해줍니다. 타이핑 필요 없어요. Wallet, 메일, 지도도 내장돼 있어요 — 앱에서 직접 써보세요.',
    },
    nav: { features: '연동 기능', how: '작동 방식', integrations: '연동 기능', cta: '앱 받기' },
    hero: {
      eyebrow: '사진 → 연락처, 캘린더, Wallet 등 자동 연동',
      headline: '한 번 찍으면,',
      headlineAccent: '알아서 정리됩니다.',
      subheadline:
        '명함, 영수증, 전단지, 약봉투에 카메라를 갖다 대세요. Snapsist가 읽어서 연락처, 캘린더, 미리 알림에 바로 써줍니다. 복사도, 재입력도 필요 없어요. Wallet, 메일, 지도도 내장돼 있어요 — 앱에서 직접 써보세요.',
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
        { title: 'AI가 대신 읽어드려요', desc: '이게 뭔지 알아서 판단하고, 이름·날짜·금액·주소 같은 정보를 자동으로 찾아내요.' },
        { title: '알아서 저장돼요', desc: '내용 확인하고 탭 한 번이면, 이미 휴대폰의 알맞은 앱에 들어가 있어요 — 내보내기도, 복사·붙여넣기도 필요 없어요.' },
      ],
      ways: [
        { icon: '📤', title: '사진 앱에서 공유', desc: '아무 사진에서나 공유 버튼을 누르고 Snapsist를 선택하면, 앱을 열 필요도 없이 바로 분석이 시작돼요.' },
        { icon: '📸', title: '앱에서 촬영하거나 선택', desc: 'Snapsist를 열어서 사진을 찍거나 갤러리에서 고르면, 똑같은 방식으로 읽어드려요.' },
      ],
    },
    features: {
      eyebrow: '연동 기능',
      headline: '이미 쓰고 있는 앱에 바로 써줍니다',
      sub: '연락처·캘린더·미리 알림은 사진에서 바로 저장됩니다. 나머지도 실제로 작동하는 진짜 연동 기능이에요 — 앱 안 데모에서 직접 써보세요.',
      items: [
        { icon: 'contacts', title: '연락처', desc: '이름, 회사, 직함, 전화, 이메일, 주소, 생일, SNS까지.', tag: '완전 자동', platforms: ['ios', 'android'] },
        { icon: 'calendar', title: '캘린더', desc: '제목, 시간, 장소, 알림, 반복까지 — 진짜 일정으로 등록됩니다.', tag: '완전 자동', platforms: ['ios', 'android'] },
        { icon: 'reminders', title: '미리 알림', desc: '복용 일정과 마감일·장소·알림이 있는 할 일 (iOS).', tag: '완전 자동', platforms: ['ios'] },
        { icon: 'photos', title: '사진', desc: '앨범에 바로 저장돼서 필요할 때 바로 찾을 수 있어요.', tag: '앱 데모에서 체험', platforms: ['ios', 'android'] },
        { icon: 'wallet', title: 'Apple Wallet', desc: '서명된 패스를 Wallet에 바로 추가합니다.', tag: '앱 데모에서 체험', platforms: ['ios'] },
        { icon: 'mail', title: '메일 · 문자', desc: '내용이 채워진 초안이 뜨고, 탭 한 번이면 전송됩니다.', tag: '앱 데모에서 체험', platforms: ['ios', 'android'] },
        { icon: 'notes', title: '메모', desc: '일괄 처리 시, 정리된 형태로 공유 시트를 통해 메모 앱으로 전달됩니다.', tag: '한 번 탭', platforms: ['ios', 'android'] },
        { icon: 'maps', title: '지도', desc: '주소를 Apple/Google 지도에서 바로 열어줍니다.', tag: '앱 데모에서 체험', platforms: ['ios', 'android'] },
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
        { title: '진짜 연동입니다, 우회가 아니라', desc: 'Apple의 연락처·캘린더·Wallet 앱이 쓰는 것과 똑같은 공식 통로로 저장합니다 — 복사본도, 편법도 아니에요.' },
      ],
    },
    faq: {
      eyebrow: 'FAQ',
      headline: '실제로 많이 물어보시는 것들',
      items: [
        { q: '계정을 만들어야 하나요?', a: '아니요 — 핵심 기능(연락처, 캘린더, 미리 알림)은 계정 없이도 다 되고, Wallet·메일·지도도 앱 데모에서 계정 없이 체험할 수 있어요. 무료 계정을 만들면 토큰 50개를 드리고, 웹 대시보드에서 히스토리도 동기화돼요.' },
        { q: '제 사진이 어딘가에 저장되나요?', a: '아니요 — 사진은 분석을 위해 전송된 뒤 즉시 폐기돼요. 사본을 저장하지 않아요. 사진은 사용자 기기에만, 앱의 로컬 히스토리에 남아요. 로그인 상태라면 분석 결과(카테고리, 요약)만 계정에 저장되어 웹 대시보드에서 확인할 수 있지만, 사진 자체는 절대 저장되지 않아요.' },
        { q: '항목을 잘못 인식하면 어떡하죠?', a: '저장 전에 항상 확인 화면이 먼저 뜨고, 실제로 저장될 항목을 정확히 보여줍니다. 뭐든 수정하거나 취소할 수 있고, 확인을 누르기 전엔 아무것도 저장되지 않아요.' },
        { q: '왜 메모는 바로 저장 안 하고 공유 시트를 여나요?', a: 'Apple과 Google 둘 다 Notes/Keep 앱에 쓸 수 있는 공개 API를 제공하지 않아서, 어떤 서드파티 앱도 직접 쓸 방법이 없어요. 그래서 Snapsist는 정리된 메모를 공유 시트로 넘겨줍니다 — 탭 0번이 아니라 1번이지만, 기술적으로 가능한 최선입니다.' },
        { q: 'Android도 지원하나요?', a: 'Android 버전은 개발 중이에요 — 지금은 iOS TestFlight 베타에 참여하실 수 있어요. 미리 알림과 Apple Wallet은 애초에 iOS 전용 프레임워크라, Android 버전이 나와도 이 두 개는 계속 iOS에서만 됩니다.' },
        { q: '비용은요?', a: '복약·문서·미인식 사진은 언제나 무료예요. 명함·영수증·행사 전단은 토큰이 필요해요 — 분석 1회당 10토큰이에요. 신규 가입 시 무료 토큰 50개를 드리고, 이후엔 $2.99부터 시작하는 패키지로 구매할 수 있어요.' },
        { q: '토큰에 유효기간이 있나요?', a: '아니요 — 한 번 구매하면 언제든 원하실 때 쓰실 수 있어요. 해지해야 할 구독 같은 건 없어요.' },
        { q: '계정을 삭제할 수 있나요?', a: '네. 설정의 계정 삭제 버튼으로 계정과 데이터를 바로 영구 삭제할 수 있어요 — 따로 문의할 필요 없어요.' },
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
  ja: {
    meta: {
      title: 'Snapsist — 写真1枚で自動整理',
      description:
        'Snapsistは名刺、レシート、イベントチラシ、お薬手帳を撮影するだけで読み取り、連絡先・カレンダー・リマインダーに自動で保存します。入力不要。Wallet、メール、マップも搭載 — アプリ内で試せます。',
    },
    nav: { features: '連携機能', how: '使い方', integrations: '連携機能', cta: 'アプリを入手' },
    hero: {
      eyebrow: '写真 → 連絡先・カレンダー・Walletなどに自動連携',
      headline: '一度撮るだけで、',
      headlineAccent: '自動で整理されます。',
      subheadline:
        '名刺やレシート、チラシ、お薬手帳にカメラを向けてください。Snapsistが読み取り、連絡先、カレンダー、リマインダーにそのまま書き込みます。コピーも再入力も不要です。Wallet、メール、マップも搭載しています — アプリ内で試せます。',
      ctaPrimary: 'TestFlightで入手',
      ctaSecondary: '使い方を見る',
      mockCaption: '保存前にすべての項目を表示します — 勝手に処理されることはありません。',
    },
    trust: {
      label: 'すべて端末内の連携機能で動作します',
      items: ['連絡先', 'カレンダー', 'リマインダー', 'Wallet', 'メール', 'ファイル'],
    },
    how: {
      eyebrow: '使い方',
      headline: '3ステップ、入力はゼロ',
      steps: [
        { title: '撮影', desc: '名刺やレシート、チラシなど保存したいものを撮影するか、ライブラリから選んでください。' },
        { title: 'AIが代わりに読み取ります', desc: '何の写真かを自動で判断し、名前・日付・金額・住所などの情報を自動で抽出します。' },
        { title: '自動で保存されます', desc: '内容を確認してタップするだけで、スマホの適切なアプリにすでに反映されています — 書き出しもコピペも不要です。' },
      ],
      ways: [
        { icon: '📤', title: '写真アプリから共有', desc: 'どの写真でも共有ボタンをタップしてSnapsistを選ぶだけで、アプリを開かなくてもすぐに解析が始まります。' },
        { icon: '📸', title: 'アプリ内で撮影・選択', desc: 'Snapsistを開いて撮影するかライブラリから選ぶと、同じように読み取ります。' },
      ],
    },
    features: {
      eyebrow: '連携機能',
      headline: 'すでに使っているアプリにそのまま書き込みます',
      sub: '連絡先・カレンダー・リマインダーは撮影した写真からそのまま保存されます。それ以外も実際に動く本物の連携機能です — アプリ内蔵のデモで試せます。',
      items: [
        { icon: 'contacts', title: '連絡先', desc: '氏名、会社、役職、電話番号、メール、住所、誕生日、SNSまで。', tag: '完全自動', platforms: ['ios', 'android'] },
        { icon: 'calendar', title: 'カレンダー', desc: 'タイトル、時間、場所、通知、繰り返しまで — メモではなく本物の予定として登録。', tag: '完全自動', platforms: ['ios', 'android'] },
        { icon: 'reminders', title: 'リマインダー', desc: '服薬スケジュールや、期限・場所・通知付きのToDo（iOS）。', tag: '完全自動', platforms: ['ios'] },
        { icon: 'photos', title: '写真', desc: 'アルバムに直接保存され、必要なときにすぐ見つかります。', tag: 'アプリ内デモで体験', platforms: ['ios', 'android'] },
        { icon: 'wallet', title: 'Apple Wallet', desc: '署名済みのスキャン可能なパスをWalletに直接追加。', tag: 'アプリ内デモで体験', platforms: ['ios'] },
        { icon: 'mail', title: 'メール・メッセージ', desc: '内容が入力済みの下書きが表示され、タップ一つで送信できます。', tag: 'アプリ内デモで体験', platforms: ['ios', 'android'] },
        { icon: 'notes', title: 'メモ', desc: '一括処理時、整形された内容が共有シート経由でメモアプリに渡されます。', tag: 'ワンタップで保存', platforms: ['ios', 'android'] },
        { icon: 'maps', title: 'マップ', desc: '住所をApple/Googleマップでそのまま開きます。', tag: 'アプリ内デモで体験', platforms: ['ios', 'android'] },
      ],
    },
    preview: {
      eyebrow: '隠しごとなし',
      headline: '保存前にすべての項目を確認できます',
      sub: 'Snapsistは黙って保存しません。どのボタンを押しても、実際に書き込まれる内容を一覧表示する確認画面が開きます — 必要な部分を編集してから確定してください。',
      sourceLabel: '名刺',
      destLabel: '連絡先',
      fields: [
        { label: '姓 / 名', value: 'John / Smith' },
        { label: '携帯電話', value: '+1 123-456-7894' },
        { label: '勤務先メール', value: 'john.smith@example.com' },
        { label: '会社名 / 役職', value: 'Snapsist Inc. / Product Manager' },
        { label: '住所', value: '123 Main St, San Francisco, CA' },
      ],
      note: 'これは実際のアプリの確認画面です — 隠したり簡略化したりしていません。',
      button: '連絡先に保存',
    },
    why: {
      eyebrow: 'Snapsistを選ぶ理由',
      headline: '自動化の主導権はあなたにあります',
      items: [
        { title: '基本的に端末の外には出ません', desc: '保存は常にお使いの端末上のアプリへ直接書き込まれます。主要機能の利用にアカウントは不要です。' },
        { title: 'すべての保存はあなたが承認します', desc: '連絡先・カレンダー・Walletに何かが書き込まれる前に、確認画面で内容を正確に表示します。' },
        { title: '本物の連携です、回避策ではありません', desc: 'SnapsistはAppleの連絡先・カレンダー・Wallet自体が使うのと同じ正規の方法で保存します — コピーでも裏技でもありません。' },
      ],
    },
    faq: {
      eyebrow: 'よくある質問',
      headline: '実際によく聞かれること',
      items: [
        { q: 'アカウント登録は必要ですか？', a: 'いいえ — 主要機能（連絡先、カレンダー、リマインダー）はアカウントなしで使え、Wallet・メール・マップもアプリ内デモでアカウントなしで試せます。無料アカウントを作成すると、無料トークン50個がもらえ、Webダッシュボードで履歴も同期されます。' },
        { q: '撮影した写真はどこかに保存されますか？', a: 'いいえ — 写真は解析のために送信された後、直ちに破棄されます。コピーを保存することはありません。写真はお使いの端末上、アプリのローカル履歴にのみ残ります。ログイン中の場合、解析結果（カテゴリ、要約）のみアカウントに保存され、Webダッシュボードで確認できますが、写真自体は保存されません。' },
        { q: '内容が間違って認識された場合は？', a: '保存前に必ず確認画面が開き、実際に書き込まれる項目が正確に表示されます。内容を編集したりキャンセルしたりでき、確定するまで何も保存されません。' },
        { q: 'なぜメモは直接保存せず共有シートを開くのですか？', a: 'AppleもGoogleもメモ/Keepアプリへの公開APIを提供していないため、どのサードパーティアプリも直接書き込む方法がありません。そのためSnapsistは整形済みのメモを共有シート経由で渡します — タップ0回ではなく1回になりますが、技術的に可能な最善の方法です。' },
        { q: 'Androidにも対応していますか？', a: 'Android版は開発中です — 現在はiOSのTestFlightベータにご参加いただけます。リマインダーとApple Walletはそもそもの機能上iOS専用のため、Android版が出てもこの2つはiOSのみとなります。' },
        { q: '料金はいくらですか？', a: '服薬・書類・未認識の写真は常に無料です。名刺・レシート・イベントチラシはトークンが必要です — 1回の解析につきトークン10個。新規登録で無料トークン50個を差し上げ、以降は$2.99からのパッケージでご購入いただけます。' },
        { q: 'トークンに有効期限はありますか？', a: 'いいえ — 一度購入すれば、好きなときにいつでも使えます。解約すべきサブスクリプションはありません。' },
        { q: 'アカウントを削除できますか？', a: 'はい。設定の「アカウントを削除」からアカウントとデータをすぐに完全に削除できます — サポートへの連絡は不要です。' },
      ],
    },
    cta: {
      headline: '写真にすでに書いてある内容を、もう一度入力しないでください。',
      sub: 'Snapsistは現在テスト中です — 誰よりも早くTestFlightで試してみてください。',
      button: 'TestFlightで入手',
      note: 'iOS・ベータ期間中は無料',
    },
    footer: {
      tagline: '写真1枚で、すべてのアプリが自動更新されます。',
      rights: 'All rights reserved.',
    },
  },
  zh: {
    meta: {
      title: 'Snapsist — 一张照片，自动归档',
      description:
        'Snapsist 拍下名片、收据、活动传单或药品说明后自动识别，直接保存到通讯录、日历、提醒事项 — 无需手动输入。Wallet、邮件、地图同样内置 — 可在应用内体验。',
    },
    nav: { features: '集成功能', how: '使用方法', integrations: '集成功能', cta: '获取应用' },
    hero: {
      eyebrow: '照片 → 自动同步到通讯录、日历、Wallet 等',
      headline: '拍一次，',
      headlineAccent: '自动帮你整理。',
      subheadline:
        '把镜头对准名片、收据、传单或药品说明。Snapsist 会读取内容，直接写入通讯录、日历、提醒事项 — 无需复制粘贴，无需重新输入。Wallet、邮件、地图也已内置 — 可在应用内体验。',
      ctaPrimary: '在 TestFlight 获取',
      ctaSecondary: '查看使用方法',
      mockCaption: '保存前会显示每一项内容 — 绝不会悄悄处理。',
    },
    trust: {
      label: '完全基于设备原生功能集成',
      items: ['通讯录', '日历', '提醒事项', 'Wallet', '邮件', '文件'],
    },
    how: {
      eyebrow: '使用方法',
      headline: '三步搞定，零输入',
      steps: [
        { title: '拍摄', desc: '拍一张照片，或从相册中选择 — 名片、收据、传单，任何需要保存的内容都可以。' },
        { title: 'AI 自动帮你读取', desc: '它会判断这是什么内容，并自动提取姓名、日期、金额、地址等细节。' },
        { title: '自动保存', desc: '确认内容后轻点一下，它就已经出现在手机里对应的应用中 — 无需导出，无需复制粘贴。' },
      ],
      ways: [
        { icon: '📤', title: '从相册分享', desc: '在任意照片上点击分享，选择 Snapsist，无需先打开应用，分析立即开始。' },
        { icon: '📸', title: '在应用内拍摄或选择', desc: '打开 Snapsist，拍照或从相册中选择，识别方式完全一样。' },
      ],
    },
    features: {
      eyebrow: '集成功能',
      headline: '直接写入你已经信任的应用',
      sub: '通讯录、日历、提醒事项会直接从你拍摄的照片保存。其余功能同样是真实可用的集成 — 可在应用内置的演示中体验。',
      items: [
        { icon: 'contacts', title: '通讯录', desc: '姓名、公司、职位、电话、邮箱、地址、生日、社交账号，全都有。', tag: '全自动', platforms: ['ios', 'android'] },
        { icon: 'calendar', title: '日历', desc: '标题、时间、地点、提醒、重复规则 — 是真正的日程，不只是备注。', tag: '全自动', platforms: ['ios', 'android'] },
        { icon: 'reminders', title: '提醒事项', desc: '服药计划，以及带截止日期、地点和提醒的待办事项（iOS）。', tag: '全自动', platforms: ['ios'] },
        { icon: 'photos', title: '照片', desc: '直接保存到相册，需要时随时可找到。', tag: '应用内演示体验', platforms: ['ios', 'android'] },
        { icon: 'wallet', title: 'Apple Wallet', desc: '已签名、可扫描的卡券直接添加到 Wallet。', tag: '应用内演示体验', platforms: ['ios'] },
        { icon: 'mail', title: '邮件与信息', desc: '草稿会自动填好内容，轻点一下即可发送。', tag: '应用内演示体验', platforms: ['ios', 'android'] },
        { icon: 'notes', title: '备忘录', desc: '批量处理时，整理好的内容会通过分享面板传给备忘录应用。', tag: '一键归档', platforms: ['ios', 'android'] },
        { icon: 'maps', title: '地图', desc: '直接在苹果地图或谷歌地图中打开地址。', tag: '应用内演示体验', platforms: ['ios', 'android'] },
      ],
    },
    preview: {
      eyebrow: '绝无隐瞒',
      headline: '保存前你会看到每一项内容',
      sub: 'Snapsist 从不悄悄写入。每个按钮都会先打开一个确认页面，列出即将写入的具体内容 — 你可以先修改重要信息，再确认。',
      sourceLabel: '名片',
      destLabel: '通讯录',
      fields: [
        { label: '姓 / 名', value: 'John / Smith' },
        { label: '手机号', value: '+1 123-456-7894' },
        { label: '工作邮箱', value: 'john.smith@example.com' },
        { label: '公司 / 职位', value: 'Snapsist Inc. / Product Manager' },
        { label: '地址', value: '123 Main St, San Francisco, CA' },
      ],
      note: '这就是应用里真实的确认界面 — 没有隐藏，没有简化。',
      button: '保存到通讯录',
    },
    why: {
      eyebrow: '为什么选择 Snapsist',
      headline: '自动化，但主动权始终在你手中',
      items: [
        { title: '默认不会离开你的手机', desc: '每次保存都直接写入你设备上的应用。使用核心功能无需注册账号。' },
        { title: '每一次写入都需要你确认', desc: '在任何内容写入通讯录、日历或 Wallet 之前，确认页面都会准确显示将要写入的内容。' },
        { title: '真正的集成，不是变通方案', desc: 'Snapsist 使用的正是苹果自家通讯录、日历、Wallet 应用所用的官方保存方式 — 不是复制，也不是投机取巧。' },
      ],
    },
    faq: {
      eyebrow: '常见问题',
      headline: '大家真正会问的问题',
      items: [
        { q: '需要注册账号吗？', a: '不需要。核心功能（通讯录、日历、提醒事项）不需要账号也能用，Wallet、邮件、地图也可以在应用内演示中免账号体验。创建免费账号可获得 50 个免费代币，还能在网页控制面板中同步历史记录。' },
        { q: '我的照片会被存储在哪里吗？', a: '不会——照片仅用于分析，之后立即删除，我们绝不会保留副本。照片只会保存在您自己的设备上，在应用的本地历史记录中。如果您已登录，我们只会将分析结果（类别、摘要）保存到您的账户，以便在网页控制面板中查看，但绝不会保存照片本身。' },
        { q: '如果 Snapsist 识别错了怎么办？', a: '每次保存前都会先打开确认页面，列出即将写入的具体内容。你可以修改任意内容，或直接取消 — 在你确认之前不会保存任何东西。' },
        { q: '为什么备忘录不能直接保存，而是打开分享面板？', a: '苹果和谷歌都没有为备忘录 / Keep 应用提供公开的接口，所以任何第三方应用都无法直接写入。因此 Snapsist 会通过分享面板把整理好的备忘录传递过去 — 虽然要多点一下，但这已经是技术上能做到的最好方式。' },
        { q: '支持 Android 吗？', a: 'Android 版正在开发中 — 目前可以加入 iOS 的 TestFlight 测试版。提醒事项和 Apple Wallet 本身就是 iOS 专属功能，即使以后推出 Android 版本，这两项功能仍只在 iOS 上可用。' },
        { q: '需要付费吗？', a: '服药、文档和未识别的照片始终免费。名片、收据和活动传单需要代币——每次分析消耗 10 个代币。新注册账号可获得 50 个免费代币，之后可购买代币包，价格从 $2.99 起。' },
        { q: '代币会过期吗？', a: '不会——购买后可以随时使用，没有需要取消的订阅。' },
        { q: '可以删除账户吗？', a: '可以。在设置的"删除账户"里可以立即永久删除账户和数据 — 不需要联系客服。' },
      ],
    },
    cta: {
      headline: '照片上已经写好的内容，别再手动输入一遍了。',
      sub: 'Snapsist 目前正在测试中 — 加入 TestFlight，抢先体验。',
      button: '在 TestFlight 获取',
      note: 'iOS · 测试期间免费',
    },
    footer: {
      tagline: '一张照片，所有应用自动更新。',
      rights: '保留所有权利。',
    },
  },
  es: {
    meta: {
      title: 'Snapsist — Una foto, todo archivado automáticamente',
      description:
        'Snapsist lee la foto de una tarjeta de presentación, un recibo, un cartel de un evento o el prospecto de un medicamento, y la guarda directamente en Contactos, Calendario o Recordatorios — sin escribir nada. Wallet, Correo y Mapas también están integrados — pruébalos en la app.',
    },
    nav: { features: 'Integraciones', how: 'Cómo funciona', integrations: 'Integraciones', cta: 'Obtener la app' },
    hero: {
      eyebrow: 'Foto → Contactos, Calendario, Wallet y más',
      headline: 'Tómala una vez.',
      headlineAccent: 'Se archiva sola.',
      subheadline:
        'Apunta la cámara a una tarjeta de presentación, un recibo, un cartel o el prospecto de un medicamento. Snapsist la lee y la escribe directamente en Contactos, Calendario o Recordatorios — sin copiar ni volver a escribir nada. Wallet, Correo y Mapas también están integrados — pruébalos en la app.',
      ctaPrimary: 'Consíguela en TestFlight',
      ctaSecondary: 'Ver cómo funciona',
      mockCaption: 'Se muestran todos los campos antes de guardar — nada ocurre en silencio.',
    },
    trust: {
      label: 'Integraciones construidas enteramente en el dispositivo',
      items: ['Contactos', 'Calendario', 'Recordatorios', 'Wallet', 'Correo', 'Archivos'],
    },
    how: {
      eyebrow: 'Cómo funciona',
      headline: 'Tres pasos. Cero escritura.',
      steps: [
        { title: 'Toma la foto', desc: 'Haz una foto o elige una de tu galería — una tarjeta, un recibo, un cartel, lo que necesites guardar.' },
        { title: 'La IA la lee por ti', desc: 'Descubre de qué se trata y extrae los detalles — nombres, fechas, importes, direcciones — automáticamente.' },
        { title: 'Se guarda sola', desc: 'Revisa los datos, toca una vez, y ya está en la app correcta de tu teléfono — sin exportar, sin copiar y pegar.' },
      ],
      ways: [
        { icon: '📤', title: 'Comparte desde Fotos', desc: 'Toca Compartir en cualquier foto, elige Snapsist, y el análisis empieza al instante — ni siquiera hace falta abrir la app primero.' },
        { icon: '📸', title: 'Haz la foto o elígela en la app', desc: 'Abre Snapsist, toma una foto o elige una de tu galería, y la lee igual.' },
      ],
    },
    features: {
      eyebrow: 'Integraciones',
      headline: 'Escribe en las apps en las que ya confías',
      sub: 'Contactos, Calendario y Recordatorios se guardan directamente desde lo que fotografías. El resto también son integraciones reales y funcionales — pruébalas en la demo integrada de la app.',
      items: [
        { icon: 'contacts', title: 'Contactos', desc: 'Nombre completo, empresa, cargo, teléfonos, correos, direcciones, cumpleaños, redes sociales.', tag: 'Totalmente automático', platforms: ['ios', 'android'] },
        { icon: 'calendar', title: 'Calendario', desc: 'Título, hora, ubicación, alertas, repetición — un evento real, no una nota.', tag: 'Totalmente automático', platforms: ['ios', 'android'] },
        { icon: 'reminders', title: 'Recordatorios', desc: 'Horarios de medicación y tareas con fecha límite, ubicación y alertas en iOS.', tag: 'Totalmente automático', platforms: ['ios'] },
        { icon: 'photos', title: 'Fotos', desc: 'Guardadas directamente en un álbum, listas cuando las necesites.', tag: 'Pruébalo en la demo', platforms: ['ios', 'android'] },
        { icon: 'wallet', title: 'Apple Wallet', desc: 'Tarjetas firmadas y escaneables añadidas directamente a Wallet.', tag: 'Pruébalo en la demo', platforms: ['ios'] },
        { icon: 'mail', title: 'Correo y mensajes', desc: 'Aparece un borrador ya redactado, listo para enviar con un toque.', tag: 'Pruébalo en la demo', platforms: ['ios', 'android'] },
        { icon: 'notes', title: 'Notas', desc: 'Al procesar fotos por lotes, se entrega en formato ordenado a Notas mediante la hoja de compartir.', tag: 'Un toque para archivar', platforms: ['ios', 'android'] },
        { icon: 'maps', title: 'Mapas', desc: 'Abre la dirección directamente en Apple o Google Maps.', tag: 'Pruébalo en la demo', platforms: ['ios', 'android'] },
      ],
    },
    preview: {
      eyebrow: 'Sin sorpresas',
      headline: 'Ves cada campo antes de que se guarde nada',
      sub: 'Snapsist nunca escribe en silencio. Cada botón abre una pantalla de revisión con exactamente lo que se va a escribir — edita lo que haga falta y confirma.',
      sourceLabel: 'Tarjeta de presentación',
      destLabel: 'Contactos',
      fields: [
        { label: 'Nombre / Apellido', value: 'John / Smith' },
        { label: 'Móvil', value: '+1 123-456-7894' },
        { label: 'Correo del trabajo', value: 'john.smith@example.com' },
        { label: 'Empresa / Cargo', value: 'Snapsist Inc. / Product Manager' },
        { label: 'Dirección', value: '123 Main St, San Francisco, CA' },
      ],
      note: 'Esta es la pantalla de revisión real de la app — nada está oculto ni simplificado.',
      button: 'Guardar en Contactos',
    },
    why: {
      eyebrow: 'Por qué Snapsist',
      headline: 'Automatización que sigue tus reglas',
      items: [
        { title: 'Por defecto, nada sale de tu teléfono', desc: 'Cada guardado escribe directamente en la app de tu dispositivo. No hace falta cuenta para las funciones principales.' },
        { title: 'Apruebas cada escritura', desc: 'Una pantalla de revisión muestra los campos exactos antes de tocar Contactos, Calendario o Wallet.' },
        { title: 'Integraciones reales, no trucos', desc: 'Snapsist guarda por el mismo canal oficial que usan las propias apps de Contactos, Calendario y Wallet de Apple — no es una copia ni un atajo.' },
      ],
    },
    faq: {
      eyebrow: 'Preguntas frecuentes',
      headline: 'Lo que la gente realmente pregunta',
      items: [
        { q: '¿Necesito crear una cuenta?', a: 'No — las funciones principales (Contactos, Calendario, Recordatorios) funcionan sin cuenta, y también puedes probar Wallet, Correo y Mapas en la demo de la app sin cuenta. Crear una cuenta gratuita te da 50 tokens de regalo y un historial sincronizado en el panel web.' },
        { q: '¿Se guarda mi foto en algún sitio?', a: 'No — tu foto se envía para analizarla y se elimina inmediatamente después; nunca guardamos una copia. Se queda solo en tu propio dispositivo, en el historial local de la app. Si has iniciado sesión, guardamos el resultado extraído (categoría, resumen) en tu cuenta para que lo veas en el panel web — pero nunca la foto en sí.' },
        { q: '¿Y si Snapsist reconoce mal un campo?', a: 'Cada guardado abre primero una pantalla de revisión con los campos exactos que se van a escribir. Puedes editar cualquier cosa o cancelar — no se guarda nada hasta que confirmas.' },
        { q: '¿Por qué Snapsist abre la hoja de compartir para Notas en vez de guardar directamente?', a: 'Ni Apple ni Google ofrecen una API pública para sus apps de Notas / Keep, así que ninguna app externa puede escribir directamente en ellas. Snapsist entrega en su lugar una nota ya formateada mediante la hoja de compartir — un toque en vez de cero, que es lo máximo que se puede automatizar técnicamente.' },
        { q: '¿Está disponible en Android?', a: 'La versión para Android está en desarrollo — por ahora puedes unirte a la beta de iOS en TestFlight. Recordatorios y Apple Wallet son funciones exclusivas de iOS de todos modos, así que seguirán siendo solo de iOS incluso cuando llegue Android.' },
        { q: '¿Cuánto cuesta?', a: 'Medicamentos, documentos y fotos no reconocidas siempre son gratis. Las tarjetas de presentación, recibos y carteles de eventos usan tokens — 10 tokens por análisis. Las cuentas nuevas reciben 50 tokens gratis; se pueden comprar más en paquetes desde $2.99.' },
        { q: '¿Caducan mis tokens?', a: 'No — cómpralos una vez y úsalos cuando quieras. No hay ninguna suscripción que cancelar.' },
        { q: '¿Puedo eliminar mi cuenta?', a: 'Sí. En Ajustes hay una opción para eliminar la cuenta que borra tu cuenta y tus datos de forma permanente al instante — sin tener que contactar con soporte.' },
      ],
    },
    cta: {
      headline: 'Deja de volver a escribir lo que una foto ya dice.',
      sub: 'Snapsist está en pruebas ahora mismo — únete a TestFlight para probarla antes que nadie.',
      button: 'Consíguela en TestFlight',
      note: 'iOS · Gratis durante la beta',
    },
    footer: {
      tagline: 'Una foto. Todas las apps, actualizadas automáticamente.',
      rights: 'Todos los derechos reservados.',
    },
  },
  fr: {
    meta: {
      title: 'Snapsist — Une photo, tout est classé automatiquement',
      description:
        'Snapsist lit la photo d’une carte de visite, d’un reçu, d’une affiche d’événement ou d’une notice de médicament, et l’enregistre directement dans Contacts, Calendrier ou Rappels — sans rien taper. Wallet, Mail et Plans sont aussi intégrés — essayez-les dans l’app.',
    },
    nav: { features: 'Intégrations', how: 'Comment ça marche', integrations: 'Intégrations', cta: 'Obtenir l’app' },
    hero: {
      eyebrow: 'Photo → Contacts, Calendrier, Wallet et plus',
      headline: 'Prenez la photo une fois.',
      headlineAccent: 'Elle se classe toute seule.',
      subheadline:
        'Pointez votre appareil photo sur une carte de visite, un reçu, une affiche ou une notice de médicament. Snapsist la lit et l’enregistre directement dans Contacts, Calendrier ou Rappels — sans copier, sans ressaisir. Wallet, Mail et Plans sont aussi intégrés — essayez-les dans l’app.',
      ctaPrimary: 'Obtenir sur TestFlight',
      ctaSecondary: 'Voir comment ça marche',
      mockCaption: 'Chaque champ est affiché avant l’enregistrement — rien ne se passe en silence.',
    },
    trust: {
      label: 'Des intégrations entièrement sur l’appareil',
      items: ['Contacts', 'Calendrier', 'Rappels', 'Wallet', 'Mail', 'Fichiers'],
    },
    how: {
      eyebrow: 'Comment ça marche',
      headline: 'Trois étapes. Zéro saisie.',
      steps: [
        { title: 'Photographiez', desc: 'Prenez une photo ou choisissez-en une dans votre photothèque — une carte de visite, un reçu, une affiche, tout ce qu’il faut enregistrer.' },
        { title: 'L’IA la lit pour vous', desc: 'Elle détermine de quoi il s’agit et en extrait les informations — noms, dates, montants, adresses — automatiquement.' },
        { title: 'Elle s’enregistre toute seule', desc: 'Vérifiez les informations, appuyez une fois, et c’est déjà dans la bonne application de votre téléphone — sans export, sans copier-coller.' },
      ],
      ways: [
        { icon: '📤', title: 'Partagez depuis Photos', desc: 'Appuyez sur Partager sur n’importe quelle photo, choisissez Snapsist, et l’analyse démarre aussitôt — pas besoin même d’ouvrir l’app d’abord.' },
        { icon: '📸', title: 'Photographiez ou choisissez dans l’app', desc: 'Ouvrez Snapsist, prenez une photo ou choisissez-en une dans votre photothèque, et elle la lit de la même façon.' },
      ],
    },
    features: {
      eyebrow: 'Intégrations',
      headline: 'Elle écrit dans les applications que vous utilisez déjà',
      sub: 'Contacts, Calendrier et Rappels s’enregistrent directement à partir de ce que vous photographiez. Les autres sont aussi de vraies intégrations fonctionnelles — essayez-les dans la démo intégrée à l’app.',
      items: [
        { icon: 'contacts', title: 'Contacts', desc: 'Nom complet, société, poste, téléphones, e-mails, adresses, anniversaire, réseaux sociaux.', tag: 'Entièrement automatique', platforms: ['ios', 'android'] },
        { icon: 'calendar', title: 'Calendrier', desc: 'Titre, heure, lieu, alertes, récurrence — un vrai événement, pas une simple note.', tag: 'Entièrement automatique', platforms: ['ios', 'android'] },
        { icon: 'reminders', title: 'Rappels', desc: 'Plans de prise de médicaments et tâches avec échéance, lieu et alertes, sous iOS.', tag: 'Entièrement automatique', platforms: ['ios'] },
        { icon: 'photos', title: 'Photos', desc: 'Enregistrées directement dans un album, prêtes quand vous en avez besoin.', tag: 'À essayer dans la démo', platforms: ['ios', 'android'] },
        { icon: 'wallet', title: 'Apple Wallet', desc: 'Des cartes signées et scannables ajoutées directement dans Wallet.', tag: 'À essayer dans la démo', platforms: ['ios'] },
        { icon: 'mail', title: 'Mail et Messages', desc: 'Un brouillon apparaît déjà rempli, prêt à être envoyé en un geste.', tag: 'À essayer dans la démo', platforms: ['ios', 'android'] },
        { icon: 'notes', title: 'Notes', desc: 'Lors d’un traitement par lots, transmise, mise en forme, à l’app Notes via la feuille de partage.', tag: 'Classement en un geste', platforms: ['ios', 'android'] },
        { icon: 'maps', title: 'Plans', desc: 'Ouvre l’adresse directement dans Apple Plans ou Google Maps.', tag: 'À essayer dans la démo', platforms: ['ios', 'android'] },
      ],
    },
    preview: {
      eyebrow: 'Aucune surprise',
      headline: 'Vous voyez chaque champ avant tout enregistrement',
      sub: 'Snapsist n’écrit jamais en silence. Chaque bouton ouvre un écran de vérification listant exactement ce qui sera écrit — modifiez ce qu’il faut, puis confirmez.',
      sourceLabel: 'Carte de visite',
      destLabel: 'Contacts',
      fields: [
        { label: 'Prénom / Nom', value: 'John / Smith' },
        { label: 'Mobile', value: '+1 123-456-7894' },
        { label: 'E-mail professionnel', value: 'john.smith@example.com' },
        { label: 'Société / Poste', value: 'Snapsist Inc. / Product Manager' },
        { label: 'Adresse', value: '123 Main St, San Francisco, CA' },
      ],
      note: 'C’est l’écran de vérification réel de l’application — rien n’est caché, rien n’est simplifié.',
      button: 'Enregistrer dans Contacts',
    },
    why: {
      eyebrow: 'Pourquoi Snapsist',
      headline: 'Une automatisation qui reste sous votre contrôle',
      items: [
        { title: 'Rien ne quitte votre téléphone par défaut', desc: 'Chaque enregistrement écrit directement dans l’application, sur l’appareil. Aucun compte n’est requis pour les fonctions principales.' },
        { title: 'Vous approuvez chaque écriture', desc: 'Un écran de vérification montre les champs exacts avant que quoi que ce soit ne touche Contacts, Calendrier ou Wallet.' },
        { title: 'De vraies intégrations, pas des contournements', desc: 'Snapsist enregistre en passant par le même canal officiel que les applications Contacts, Calendrier et Wallet d’Apple elles-mêmes — ni copie, ni astuce.' },
      ],
    },
    faq: {
      eyebrow: 'FAQ',
      headline: 'Les questions qu’on nous pose vraiment',
      items: [
        { q: 'Dois-je créer un compte ?', a: 'Non — les fonctions principales (Contacts, Calendrier, Rappels) fonctionnent sans compte, et vous pouvez aussi essayer Wallet, Mail et Plans dans la démo de l’app sans compte. Créer un compte gratuit vous donne 50 jetons offerts et un historique synchronisé dans le tableau de bord web.' },
        { q: 'Ma photo est-elle stockée quelque part ?', a: 'Non — votre photo est envoyée pour être analysée puis supprimée immédiatement ; nous n’en conservons jamais de copie. Elle reste uniquement sur votre appareil, dans l’historique local de l’app. Si vous êtes connecté, nous enregistrons le résultat extrait (catégorie, résumé) dans votre compte pour que vous puissiez le consulter sur le tableau de bord web — mais jamais la photo elle-même.' },
        { q: 'Et si Snapsist se trompe sur un champ ?', a: 'Chaque enregistrement ouvre d’abord un écran de vérification listant exactement les champs qui vont être écrits. Vous pouvez tout modifier, ou annuler — rien n’est enregistré tant que vous n’avez pas confirmé.' },
        { q: 'Pourquoi Snapsist ouvre-t-il la feuille de partage pour Notes au lieu d’enregistrer directement ?', a: 'Ni Apple ni Google ne fournissent d’API publique pour leurs applications Notes / Keep, donc aucune application tierce ne peut y écrire directement. Snapsist transmet donc une note déjà mise en forme via la feuille de partage — un geste au lieu de zéro, ce qui est le maximum qu’il soit techniquement possible d’automatiser.' },
        { q: 'Est-ce disponible sur Android ?', a: 'Une version Android est en développement — vous pouvez rejoindre dès maintenant la bêta iOS sur TestFlight. Rappels et Apple Wallet sont de toute façon des fonctions propres à iOS, donc elles resteront réservées à iOS même une fois Android disponible.' },
        { q: 'Combien ça coûte ?', a: 'Médicaments, documents et photos non reconnues sont toujours gratuits. Les cartes de visite, reçus et affiches d’événements utilisent des jetons — 10 jetons par analyse. Les nouveaux comptes reçoivent 50 jetons gratuits ; d’autres peuvent être achetés dans des packs à partir de 2,99 $.' },
        { q: 'Mes jetons expirent-ils ?', a: 'Non — achetez-les une fois et utilisez-les quand vous voulez. Il n’y a aucun abonnement à résilier.' },
        { q: 'Puis-je supprimer mon compte ?', a: 'Oui. Réglages propose une option Supprimer le compte qui efface immédiatement et définitivement votre compte et vos données — sans avoir à contacter le support.' },
      ],
    },
    cta: {
      headline: 'Arrêtez de ressaisir ce qu’une photo indique déjà.',
      sub: 'Snapsist est en phase de test — rejoignez TestFlight pour l’essayer avant tout le monde.',
      button: 'Obtenir sur TestFlight',
      note: 'iOS · Gratuit pendant la bêta',
    },
    footer: {
      tagline: 'Une photo. Toutes les applications, mises à jour automatiquement.',
      rights: 'Tous droits réservés.',
    },
  },
  de: {
    meta: {
      title: 'Snapsist — Ein Foto, automatisch abgelegt',
      description:
        'Snapsist liest das Foto einer Visitenkarte, eines Kassenbons, eines Veranstaltungsflyers oder eines Medikamentenzettels und speichert es direkt in Kontakte, Kalender oder Erinnerungen — ganz ohne Tippen. Wallet, Mail und Karten sind ebenfalls eingebaut — probier sie in der App aus.',
    },
    nav: { features: 'Integrationen', how: 'So funktioniert’s', integrations: 'Integrationen', cta: 'App holen' },
    hero: {
      eyebrow: 'Foto → Kontakte, Kalender, Wallet und mehr',
      headline: 'Einmal fotografieren.',
      headlineAccent: 'Es legt sich von selbst ab.',
      subheadline:
        'Richte die Kamera auf eine Visitenkarte, einen Kassenbon, einen Flyer oder einen Medikamentenzettel. Snapsist liest ihn und schreibt ihn direkt in Kontakte, Kalender oder Erinnerungen — ohne Abschreiben, ohne Kopieren. Wallet, Mail und Karten sind ebenfalls eingebaut — probier sie in der App aus.',
      ctaPrimary: 'Auf TestFlight holen',
      ctaSecondary: 'So funktioniert’s',
      mockCaption: 'Jedes Feld wird vor dem Speichern angezeigt — nichts passiert im Stillen.',
    },
    trust: {
      label: 'Vollständig geräteinterne Integrationen',
      items: ['Kontakte', 'Kalender', 'Erinnerungen', 'Wallet', 'Mail', 'Dateien'],
    },
    how: {
      eyebrow: 'So funktioniert’s',
      headline: 'Drei Schritte. Null Tippen.',
      steps: [
        { title: 'Fotografieren', desc: 'Mach ein Foto oder wähle eins aus deiner Mediathek — eine Visitenkarte, ein Kassenbon, ein Flyer, was auch immer gespeichert werden soll.' },
        { title: 'Die KI liest es für dich', desc: 'Sie erkennt, worum es sich handelt, und extrahiert automatisch die Details — Namen, Daten, Beträge, Adressen.' },
        { title: 'Es speichert sich von selbst', desc: 'Details prüfen, einmal tippen — und schon steht es in der richtigen App auf deinem Handy, ganz ohne Export, ohne Kopieren und Einfügen.' },
      ],
      ways: [
        { icon: '📤', title: 'Aus Fotos teilen', desc: 'Bei jedem Foto auf Teilen tippen, Snapsist auswählen — die Analyse startet sofort, du musst die App nicht mal vorher öffnen.' },
        { icon: '📸', title: 'In der App fotografieren oder auswählen', desc: 'Snapsist öffnen, ein Foto machen oder eins aus der Mediathek wählen — gelesen wird es genauso.' },
      ],
    },
    features: {
      eyebrow: 'Integrationen',
      headline: 'Schreibt in die Apps, denen du schon vertraust',
      sub: 'Kontakte, Kalender und Erinnerungen speichern direkt aus dem, was du fotografierst. Auch die anderen sind echte, funktionierende Integrationen — probier sie in der App-eigenen Demo aus.',
      items: [
        { icon: 'contacts', title: 'Kontakte', desc: 'Vollständiger Name, Firma, Position, Telefonnummern, E-Mails, Adressen, Geburtstag, Social-Media-Profile.', tag: 'Vollautomatisch', platforms: ['ios', 'android'] },
        { icon: 'calendar', title: 'Kalender', desc: 'Titel, Uhrzeit, Ort, Erinnerungen, Wiederholung — ein echter Termin, keine Notiz.', tag: 'Vollautomatisch', platforms: ['ios', 'android'] },
        { icon: 'reminders', title: 'Erinnerungen', desc: 'Medikamentenpläne und To-dos mit Fälligkeitsdatum, Ort und Erinnerungen unter iOS.', tag: 'Vollautomatisch', platforms: ['ios'] },
        { icon: 'photos', title: 'Fotos', desc: 'Direkt in einem Album gespeichert, bereit, wenn du sie brauchst.', tag: 'In der Demo ausprobieren', platforms: ['ios', 'android'] },
        { icon: 'wallet', title: 'Apple Wallet', desc: 'Signierte, scanbare Karten werden direkt zu Wallet hinzugefügt.', tag: 'In der Demo ausprobieren', platforms: ['ios'] },
        { icon: 'mail', title: 'Mail & Nachrichten', desc: 'Ein bereits ausgefüllter Entwurf erscheint, bereit zum Versenden mit einem Fingertipp.', tag: 'In der Demo ausprobieren', platforms: ['ios', 'android'] },
        { icon: 'notes', title: 'Notizen', desc: 'Bei der Stapelverarbeitung formatiert und über das Teilen-Menü an die Notizen-App übergeben.', tag: 'Ein Tipp zum Ablegen', platforms: ['ios', 'android'] },
        { icon: 'maps', title: 'Karten', desc: 'Öffnet die Adresse direkt in Apple oder Google Maps.', tag: 'In der Demo ausprobieren', platforms: ['ios', 'android'] },
      ],
    },
    preview: {
      eyebrow: 'Keine Überraschungen',
      headline: 'Du siehst jedes Feld, bevor irgendetwas gespeichert wird',
      sub: 'Snapsist speichert nie im Stillen. Jeder Button öffnet einen Prüfbildschirm, der genau auflistet, was geschrieben wird — ändere, was wichtig ist, und bestätige dann.',
      sourceLabel: 'Visitenkarte',
      destLabel: 'Kontakte',
      fields: [
        { label: 'Vor- / Nachname', value: 'John / Smith' },
        { label: 'Mobil', value: '+1 123-456-7894' },
        { label: 'Geschäftliche E-Mail', value: 'john.smith@example.com' },
        { label: 'Firma / Position', value: 'Snapsist Inc. / Product Manager' },
        { label: 'Adresse', value: '123 Main St, San Francisco, CA' },
      ],
      note: 'Das ist der echte Prüfbildschirm der App — nichts versteckt, nichts vereinfacht.',
      button: 'In Kontakten speichern',
    },
    why: {
      eyebrow: 'Warum Snapsist',
      headline: 'Automatisierung, die deine Regeln respektiert',
      items: [
        { title: 'Standardmäßig verlässt nichts dein Handy', desc: 'Jeder Speichervorgang schreibt direkt in die App auf deinem Gerät. Für die Kernfunktionen ist kein Konto nötig.' },
        { title: 'Du genehmigst jeden Schreibvorgang', desc: 'Ein Prüfbildschirm zeigt genau die Felder, bevor irgendetwas Kontakte, Kalender oder Wallet berührt.' },
        { title: 'Echte Integrationen, keine Umwege', desc: 'Snapsist speichert über denselben offiziellen Weg, den Apples eigene Kontakte-, Kalender- und Wallet-Apps nutzen — keine Kopie, kein Trick.' },
      ],
    },
    faq: {
      eyebrow: 'FAQ',
      headline: 'Fragen, die wirklich gestellt werden',
      items: [
        { q: 'Muss ich ein Konto erstellen?', a: 'Nein — die Kernfunktionen (Kontakte, Kalender, Erinnerungen) funktionieren ohne Konto, und auch Wallet, Mail und Karten kannst du in der App-Demo ohne Konto ausprobieren. Mit einem kostenlosen Konto erhältst du 50 Gratis-Token und einen synchronisierten Verlauf im Web-Dashboard.' },
        { q: 'Wird mein Foto irgendwo gespeichert?', a: 'Nein — dein Foto wird zur Analyse gesendet und danach sofort gelöscht; wir speichern niemals eine Kopie. Es bleibt nur auf deinem eigenen Gerät, im lokalen Verlauf der App. Bist du angemeldet, speichern wir das extrahierte Ergebnis (Kategorie, Zusammenfassung) in deinem Konto, damit du es im Web-Dashboard einsehen kannst — aber niemals das Foto selbst.' },
        { q: 'Was, wenn Snapsist ein Feld falsch erkennt?', a: 'Jeder Speichervorgang öffnet zuerst einen Prüfbildschirm mit genau den Feldern, die geschrieben werden. Du kannst alles bearbeiten oder abbrechen — gespeichert wird erst nach deiner Bestätigung.' },
        { q: 'Warum öffnet Snapsist für Notizen das Teilen-Menü, statt direkt zu speichern?', a: 'Weder Apple noch Google bieten eine öffentliche Schnittstelle für ihre Notizen- / Keep-App, sodass keine Drittanbieter-App direkt hineinschreiben kann. Snapsist übergibt stattdessen eine formatierte Notiz über das Teilen-Menü — ein Fingertipp statt null, mehr Automatisierung ist technisch nicht möglich.' },
        { q: 'Gibt es das auch für Android?', a: 'Eine Android-Version ist in Arbeit — im Moment kannst du der iOS-Beta auf TestFlight beitreten. Erinnerungen und Apple Wallet sind ohnehin iOS-spezifische Funktionen und bleiben auch nach dem Android-Start iOS-exklusiv.' },
        { q: 'Was kostet es?', a: 'Medikamente, Dokumente und nicht erkannte Fotos sind immer kostenlos. Visitenkarten, Kassenbons und Veranstaltungsflyer benötigen Token — 10 Token pro Analyse. Neue Konten erhalten 50 kostenlose Token; weitere gibt es in Paketen ab 2,99 $.' },
        { q: 'Verfallen meine Token?', a: 'Nein — kaufe sie einmal und nutze sie, wann immer du willst. Es gibt kein Abo, das du kündigen müsstest.' },
        { q: 'Kann ich mein Konto löschen?', a: 'Ja. In den Einstellungen gibt es die Option „Konto löschen“, die dein Konto und deine Daten sofort dauerhaft entfernt — ganz ohne Support-Anfrage.' },
      ],
    },
    cta: {
      headline: 'Hör auf, abzutippen, was auf einem Foto längst steht.',
      sub: 'Snapsist befindet sich gerade in der Testphase — tritt TestFlight bei und probiere es vor allen anderen aus.',
      button: 'Auf TestFlight holen',
      note: 'iOS · Kostenlos während der Beta',
    },
    footer: {
      tagline: 'Ein Foto. Alle Apps automatisch aktualisiert.',
      rights: 'Alle Rechte vorbehalten.',
    },
  },
};
