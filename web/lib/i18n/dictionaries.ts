import type { EmojiName } from '@/components/Emoji';

export type Locale = 'en' | 'ko' | 'es';

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  ko: '한국어',
  es: 'Español',
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
};
