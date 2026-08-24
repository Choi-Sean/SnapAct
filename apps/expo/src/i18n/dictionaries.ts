import { Category, DemoKey } from '../types';

export type Locale = 'en' | 'ko' | 'es';

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  ko: '한국어',
  es: 'Español',
};

export interface Dictionary {
  tabs: { demo: string; analyze: string; history: string; settings: string };
  onboarding: {
    subtitle: string;
    permissions: { label: string; hint: string }[];
    note: string;
    startButton: string;
    skipButton: string;
  };
  auth: {
    signupTitle: string;
    signupSubtitle: string;
    loginTitle: string;
    loginSubtitle: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    signupButton: string;
    loginButton: string;
    switchToLogin: string;
    switchToSignup: string;
  };
  pricing: {
    title: string;
    betaNote: string;
    mostPopular: string;
    perMonth: string;
    freeName: string;
    freeDesc: string;
    freeFeatures: string[];
    freeCta: string;
    proDesc: string;
    proFeatures: string[];
    proCta: string;
    tokenIntro: string;
    tier0FreeNote: string;
    tokensLabelTemplate: string;
    analysesEquivalentTemplate: string;
    buyButton: string;
  };
  account: {
    signedOutTitle: string;
    signedOutSubtitle: string;
    viewPricing: string;
    logout: string;
    cancelPlanButton: string;
    cancelPlanConfirmTitle: string;
    cancelPlanConfirmBody: string;
    cancelPlanDoneTitle: string;
    cancelPlanDoneBody: string;
    deleteAccountButton: string;
    deleteConfirmTitle: string;
    deleteConfirmBody: string;
    tokenBalanceTemplate: string;
    buyTokens: string;
  };
  home: {
    subtitle: string;
    quickDemoHeader: string;
    quickDemoSub: string;
    realAnalysisHeader: string;
    realAnalysisSub: string;
    cameraButton: string;
    galleryButton: string;
    multiSelectButton: string;
    multiSelectProgress: string;
    analyzeButton: string;
    permissionNeededTitle: string;
    permissionNeededBody: string;
    demoButtons: Record<DemoKey, { label: string; hint: string }>;
    batchDemoButton: { label: string; hint: string };
    batchDemoRejectReason: string;
    demoModeLabel: string;
    classifyLabel: string;
    contactName: string;
    contactPhone: string;
    contactEmail: string;
    contactCompany: string;
    calendarTitle: string;
    calendarLocation: string;
    calendarStart: string;
    medicationName: string;
    medicationDosage: string;
    medicationFrequencyTemplate: string;
    medicationDurationTemplate: string;
    medicationTimingBeforeMeal: string;
    medicationTimingAfterMeal: string;
    medicationTimingWithMeal: string;
    medicationTimingUnspecified: string;
    saveToContacts: string;
    saveToCalendar: string;
    saveToReminder: string;
    saveDoneTitle: string;
    saveContactDoneBody: string;
    saveCalendarDoneBody: string;
    saveReminderDoneBodyTemplate: string;
    saveFailTitle: string;
    timeConfirm: {
      title: string;
      subtitleMedication: string;
      subtitleEvent: string;
      doseLabelTemplate: string;
      confirmButton: string;
      cancelButton: string;
    };
    batchTitleTemplate: string;
    batchSavedTo: string;
    batchDoneTitle: string;
    batchDoneBodyTemplate: string;
    limitExceededTitle: string;
    limitExceededBody: string;
    layer0Unsupported: {
      title: string;
      bodyTemplate: string;
      cancelButton: string;
      onceButton: string;
      alwaysButton: string;
    };
  };
  history: {
    title: string;
    clearAll: string;
    emptyText: string;
    prev: string;
    next: string;
    closeButton: string;
    replayButton: string;
    replayNote: string;
    replayDoneTitle: string;
    replayDoneBodyTemplate: string;
    failTitle: string;
    timeJustNow: string;
    timeMinutesAgo: string;
    timeHoursAgo: string;
    timeDaysAgo: string;
    allTime: string;
    currentPeriod: string;
    previousPeriod: string;
    dateFilterLabel: string;
    datePlaceholder: string;
    applyFilter: string;
    clearFilter: string;
    dateFilterError: string;
    noResultsForFilter: string;
  };
  permissions: {
    title: string;
    subtitle: string;
    items: { label: string; hint: string }[];
    statusGranted: string;
    statusDenied: string;
    statusUndetermined: string;
    statusChecking: string;
    grantButton: string;
    notice: string;
    openSettingsButton: string;
    manageButton: string;
    legalTitle: string;
    legalTerms: string;
    legalPrivacy: string;
    legalRefund: string;
    legalChildSafety: string;
    languageTitle: string;
    layer0Title: string;
    layer0UnsupportedBody: string;
    layer0ConsentedNote: string;
    layer0RevokeButton: string;
    layer0RevokedTitle: string;
    layer0RevokedBody: string;
  };
  review: {
    titles: Record<DemoKey, string>;
    subtitle: string;
    executeLabel: string;
    shareLabel: string;
    receiptNote: string;
    walletNote: string;
    cancelButton: string;
    saveDoneTitle: string;
    saveDoneBodyTemplate: string;
    failTitle: string;
    labels: Record<string, string>;
    demo: {
      eventTitleDefault: string;
      eventNotesAuto: string;
      eventStartEnd: string;
      eventTimeZone: string;
      eventAlarm: string;
      eventRecurrence: string;
      reminderTitleDefault: string;
      reminderNotesAuto: string;
      reminderStartDue: string;
      reminderAlarm: string;
      receiptItem1: string;
      receiptPrice1: string;
      receiptItem2: string;
      receiptPrice2: string;
      receiptTotal: string;
      receiptHeaderTemplate: string;
      receiptTotalLabel: string;
      photoDetailTemplate: string;
      photoOriginalFile: string;
      contactNote: string;
      mailSubjectDefault: string;
      mailBodyFormat: string;
      mailBodyContent: string;
      mailDetailTemplate: string;
      smsMessageDefault: string;
      smsDetailTemplate: string;
      filesSaveLocation: string;
      filesContentPrefix: string;
      filesShareDialogTitle: string;
      filesDetail: string;
      walletDescriptionDefault: string;
      walletShareDialogTitle: string;
      walletDetail: string;
      notificationTitleTemplate: string;
      notificationSubtitleDefault: string;
      notificationBody: string;
      notificationTriggerDefault: string;
      notificationDetail: string;
    };
  };
  batch: {
    titleTemplate: string;
    subtitle: string;
    cancelButton: string;
    saveButtonTemplate: string;
    categoryLabels: Record<Category, string>;
    actionContact: string;
    actionCalendar: string;
    actionNote: string;
    actionSkip: string;
    errorLabel: string;
    skippedLabel: string;
    noInfoDetail: string;
    noteShareTitle: string;
  };
}

const demoKeys = (
  labels: [string, string][]
): Record<DemoKey, { label: string; hint: string }> => {
  const keys: DemoKey[] = [
    'business_card',
    'event',
    'receipt',
    'reminder',
    'photo',
    'mail',
    'sms',
    'maps',
    'files',
    'wallet',
    'notification',
  ];
  const out = {} as Record<DemoKey, { label: string; hint: string }>;
  keys.forEach((k, i) => (out[k] = { label: labels[i][0], hint: labels[i][1] }));
  return out;
};

const reviewTitles = (titles: string[]): Record<DemoKey, string> => {
  const keys: DemoKey[] = [
    'business_card',
    'event',
    'receipt',
    'reminder',
    'photo',
    'mail',
    'sms',
    'maps',
    'files',
    'wallet',
    'notification',
  ];
  const out = {} as Record<DemoKey, string>;
  keys.forEach((k, i) => (out[k] = titles[i]));
  return out;
};

const categoryLabels = (v: [string, string, string, string, string, string]): Record<Category, string> => ({
  business_card: v[0],
  receipt: v[1],
  event_flyer: v[2],
  document: v[3],
  medication: v[4],
  other: v[5],
});

export const dictionaries: Record<Locale, Dictionary> = {
  en: {
    tabs: { demo: 'Demo', analyze: 'Analyze', history: 'History', settings: 'Settings' },
    onboarding: {
      subtitle: 'One photo is all it takes.\nWe’ll file it into the right app automatically.',
      permissions: [
        { label: 'Camera', hint: 'Take photos' },
        { label: 'Photo Library', hint: 'Pick from gallery' },
        { label: 'Contacts', hint: 'Save business cards' },
        { label: 'Calendar', hint: 'Auto-add events' },
        { label: 'Reminders', hint: 'Auto-add to-dos' },
      ],
      note: 'On the next screen you’ll see several permission popups — please allow all of them for everything to work.',
      startButton: 'Allow & get started',
      skipButton: 'Try the demo first',
    },
    auth: {
      signupTitle: 'Create your account',
      signupSubtitle: 'Start free, upgrade to Pro anytime.',
      loginTitle: 'Log in',
      loginSubtitle: 'Welcome back.',
      emailPlaceholder: 'Email',
      passwordPlaceholder: 'Password (8+ characters)',
      signupButton: 'Create account',
      loginButton: 'Log in',
      switchToLogin: 'Already have an account? Log in',
      switchToSignup: "Don't have an account? Sign up",
    },
    pricing: {
      title: 'Simple pricing',
      betaNote: 'During the beta, Pro features are unlocked for everyone, free.',
      mostPopular: 'Most popular',
      perMonth: '/ mo',
      freeName: 'Free',
      freeDesc: 'Try it out, no commitment',
      freeFeatures: ['15 photos / month', 'Contacts · Calendar · Reminders · Wallet · Notes · Maps', 'On-device history'],
      freeCta: 'Start for free',
      proDesc: 'For regular use',
      proFeatures: [
        'Unlimited photos',
        'Batch-process multiple photos at once',
        'History synced across devices',
        'Priority processing',
      ],
      proCta: 'Start Pro',
      tokenIntro: 'Business cards, receipts, and event flyers use tokens. Everything else is free.',
      tier0FreeNote: 'Medication, documents, and unrecognized photos are always free — no tokens, no account needed.',
      tokensLabelTemplate: '{n} tokens',
      analysesEquivalentTemplate: '≈ {n} analyses',
      buyButton: 'Buy',
    },
    account: {
      signedOutTitle: "You're not signed in",
      signedOutSubtitle: 'Sign up to sync your history and get free starter tokens.',
      viewPricing: 'View pricing →',
      logout: 'Log out',
      cancelPlanButton: 'Cancel Pro plan',
      cancelPlanConfirmTitle: 'Cancel your Pro plan?',
      cancelPlanConfirmBody: 'You will move to the Free plan. You can upgrade again anytime.',
      cancelPlanDoneTitle: 'Plan canceled',
      cancelPlanDoneBody: 'You are now on the Free plan.',
      deleteAccountButton: 'Delete account',
      deleteConfirmTitle: 'Delete your account?',
      deleteConfirmBody: 'This permanently deletes your account. This cannot be undone.',
      tokenBalanceTemplate: '{n} tokens',
      buyTokens: 'Buy tokens →',
    },
    home: {
      subtitle: 'One photo → filed into the right app automatically',
      quickDemoHeader: 'Quick demo',
      quickDemoSub: 'Tap a button to see the review screen instantly',
      realAnalysisHeader: 'Analyze a real photo',
      realAnalysisSub: 'AI figures out what it is and pulls out the details',
      cameraButton: '📷 Take a photo',
      galleryButton: '🖼️ Choose from library',
      multiSelectButton: '🗂️ Process multiple at once',
      multiSelectProgress: 'Analyzing {done}/{total}...',
      analyzeButton: 'Analyze',
      permissionNeededTitle: 'Permission needed',
      permissionNeededBody: 'This needs access to your photos.',
      demoButtons: demoKeys([
        ['Business card', 'Save to Contacts'],
        ['Event flyer', 'Save to Calendar'],
        ['Receipt', 'Share to Notes'],
        ['To-do note', 'Save to Reminders'],
        ['Save photo', 'Auto-save to album'],
        ['Mail draft', 'Open Mail'],
        ['SMS draft', 'Open Messages'],
        ['Location photo', 'Open Maps'],
        ['Save document', 'Share as file'],
        ['Pass card', 'Add to Apple Wallet'],
        ['Schedule alert', 'Notify in 5s'],
      ]),
      batchDemoButton: { label: 'Batch upload demo', hint: '10 photos at once' },
      batchDemoRejectReason: "Couldn't classify — the image is too blurry or has no recognizable text.",
      demoModeLabel: 'DEMO MODE (no API keys)',
      classifyLabel: 'Category: {category} ({confidence}%)',
      contactName: 'Name',
      contactPhone: 'Phone',
      contactEmail: 'Email',
      contactCompany: 'Company',
      calendarTitle: 'Title',
      calendarLocation: 'Location',
      calendarStart: 'Start',
      medicationName: 'Medication',
      medicationDosage: 'Dosage',
      medicationFrequencyTemplate: '{n}x per day',
      medicationDurationTemplate: '{n}-day course',
      medicationTimingBeforeMeal: 'Before meals',
      medicationTimingAfterMeal: 'After meals',
      medicationTimingWithMeal: 'With meals',
      medicationTimingUnspecified: 'No timing specified',
      saveToContacts: 'Save to Contacts',
      saveToCalendar: 'Save to Calendar',
      saveToReminder: 'Set Reminders',
      saveDoneTitle: 'Saved',
      saveContactDoneBody: 'Saved to Contacts.',
      saveCalendarDoneBody: 'Event added to Calendar.',
      saveReminderDoneBodyTemplate: 'Daily reminders set for {n} days.',
      saveFailTitle: 'Save failed',
      timeConfirm: {
        title: 'Confirm reminder time',
        subtitleMedication: 'No exact time was found on the label — pick when to be reminded.',
        subtitleEvent: 'No exact time was found in the photo — pick a time for this event.',
        doseLabelTemplate: 'Dose {n}',
        confirmButton: 'Confirm & Save',
        cancelButton: 'Cancel',
      },
      batchTitleTemplate: '{n} photos processed',
      batchSavedTo: 'Batch',
      batchDoneTitle: 'Done',
      batchDoneBodyTemplate: 'Saved the results for {n} photos to History.',
      limitExceededTitle: 'Free plan limit reached',
      limitExceededBody: 'You\'ve reached the Free plan limit of {n} photos this month. Upgrade to Pro for unlimited photos.',
      layer0Unsupported: {
        title: 'Use server analysis instead?',
        bodyTemplate: 'On-device analysis isn\'t available on this device or app version. Continuing sends this photo to our server and uses {n} tokens. Continue?',
        cancelButton: 'Cancel',
        onceButton: 'Just this once',
        alwaysButton: 'Always do this',
      },
    },
    history: {
      title: 'History',
      clearAll: 'Clear all',
      emptyText: 'Nothing saved yet.\nTry a demo button on Home.',
      prev: 'Prev',
      next: 'Next',
      closeButton: 'Close',
      replayButton: 'Save again',
      replayNote: 'If you deleted it by accident, this re-saves the same value — no new AI call.',
      replayDoneTitle: 'Saved again',
      replayDoneBodyTemplate: 'Reapplied to {savedTo}, using the original values — no re-analysis.',
      failTitle: 'Failed',
      timeJustNow: 'just now',
      timeMinutesAgo: '{n}m ago',
      timeHoursAgo: '{n}h ago',
      timeDaysAgo: '{n}d ago',
      allTime: 'All time',
      currentPeriod: 'Current period',
      previousPeriod: 'Previous period',
      dateFilterLabel: 'Filter by date',
      datePlaceholder: 'YYYY-MM-DD',
      applyFilter: 'Apply',
      clearFilter: 'Clear',
      dateFilterError: 'Enter a valid date range (from ≤ to).',
      noResultsForFilter: 'No entries in this period.',
    },
    permissions: {
      title: 'Settings',
      subtitle: 'Permissions Snapsist is currently using',
      items: [
        { label: 'Camera', hint: 'Take photos' },
        { label: 'Photo Library', hint: 'Pick from gallery' },
        { label: 'Contacts', hint: 'Save business cards' },
        { label: 'Calendar', hint: 'Auto-add events' },
        { label: 'Reminders', hint: 'Auto-add to-dos' },
      ],
      statusGranted: 'Allowed',
      statusDenied: 'Denied',
      statusUndetermined: 'Not asked',
      statusChecking: 'Checking',
      grantButton: 'Allow',
      notice: 'A denied permission may not prompt again — open Settings to turn it on directly.',
      openSettingsButton: 'Open Settings app',
      manageButton: 'Manage',
      legalTitle: 'Legal',
      legalTerms: 'Terms of Use',
      legalPrivacy: 'Privacy Policy',
      legalRefund: 'Refund Policy',
      legalChildSafety: 'Child Safety',
      languageTitle: 'Language',
      layer0Title: 'On-device analysis',
      layer0UnsupportedBody: 'This device (or app version) can\'t run on-device analysis. Photos are analyzed on our server instead, which uses tokens.',
      layer0ConsentedNote: 'You\'ve agreed to always use server analysis without being asked each time.',
      layer0RevokeButton: 'Ask me every time instead',
      layer0RevokedTitle: 'Done',
      layer0RevokedBody: 'You\'ll be asked again before each analysis uses server processing.',
    },
    review: {
      titles: reviewTitles([
        'Business card → Contacts',
        'Event → Calendar',
        'Receipt → Notes',
        'Reminder → Reminders',
        'Photo → Gallery',
        'Mail draft',
        'SMS draft',
        'Location → Maps',
        'Document → Files',
        'Pass → Apple Wallet',
        'Schedule alert',
      ]),
      subtitle: 'These are the exact values that will be written — review, then confirm.',
      executeLabel: 'Save',
      shareLabel: 'Share',
      receiptNote: 'Apple doesn’t provide a public API for Notes, so after this pick "Notes" from the share sheet.',
      walletNote: 'Fetches a signed .pkpass from the backend. This may fail until the certificate is configured.',
      cancelButton: 'Cancel',
      saveDoneTitle: 'Saved',
      saveDoneBodyTemplate: 'Saved to {savedTo}.',
      failTitle: 'Failed',
      labels: {
        firstName: 'First Name',
        lastName: 'Last Name',
        middleName: 'Middle Name',
        prefixSuffix: 'Prefix / Suffix',
        mobile: 'Mobile',
        workEmail: 'Work Email',
        companyDept: 'Company / Dept',
        jobTitle: 'Job Title',
        birthday: 'Birthday',
        workAddress: 'Work Address',
        homepage: 'Homepage',
        relation: 'Relation',
        social: 'Social',
        note: 'Note',
        title: 'Title',
        location: 'Location',
        startEnd: 'Start / End',
        allDay: 'All Day',
        notes: 'Notes',
        url: 'URL',
        timeZone: 'Time Zone',
        availability: 'Availability',
        alarm: 'Alarm',
        recurrence: 'Recurrence',
        startDue: 'Start / Due',
        completed: 'Completed',
        saveAlbum: 'Album',
        originalFile: 'Original File',
        usedApi: 'API Used',
        recipients: 'To',
        cc: 'CC',
        bcc: 'BCC',
        subject: 'Subject',
        body: 'Body',
        attachment: 'Attachment',
        message: 'Message',
        placeName: 'Place',
        coordinates: 'Coordinates',
        route: 'Route',
        fileName: 'File Name',
        saveLocation: 'Save Location',
        shareOptions: 'Share Options',
        passType: 'Pass Type',
        organization: 'Organization',
        description: 'Description',
        primaryField: 'Primary Field',
        secondaryField: 'Secondary Field',
        barcode: 'Barcode',
        color: 'Color',
        titleSubtitle: 'Title / Subtitle',
        badgeSound: 'Badge / Sound',
        importance: 'Importance',
        trigger: 'Trigger',
      },
      demo: {
        eventTitleDefault: 'Snapsist Demo Event',
        eventNotesAuto: 'Automatically extracted from the photo.',
        eventStartEnd: 'Now ~ +1 hour',
        eventTimeZone: 'Device default',
        eventAlarm: '15 min before start',
        eventRecurrence: 'Weekly, 4 times',
        reminderTitleDefault: 'Buy milk',
        reminderNotesAuto: 'A to-do automatically added by Snapsist from a photo.',
        reminderStartDue: 'Now / Now',
        reminderAlarm: '10 min before due',
        receiptItem1: 'Americano',
        receiptPrice1: '$4.50',
        receiptItem2: 'Croissant',
        receiptPrice2: '$3.80',
        receiptTotal: '$8.30',
        receiptHeaderTemplate: '🧾 Receipt ({date})',
        receiptTotalLabel: 'Total',
        photoDetailTemplate: 'Album: {album}',
        photoOriginalFile: 'Demo PNG (1×1)',
        contactNote: 'Contact created by the Snapsist demo.',
        mailSubjectDefault: 'Snapsist demo mail',
        mailBodyFormat: 'HTML format (isHtml: true)',
        mailBodyContent: '<b>Snapsist</b> auto-filled this mail draft.',
        mailDetailTemplate: 'Status: {status}',
        smsMessageDefault: 'This is a Snapsist demo text message.',
        smsDetailTemplate: 'Status: {status}',
        filesSaveLocation: 'Documents directory (Paths.document)',
        filesContentPrefix: 'Snapsist demo file\nCreated: ',
        filesShareDialogTitle: 'Save Snapsist file',
        filesDetail: 'Saved to documents directory',
        walletDescriptionDefault: 'Snapsist demo pass',
        walletShareDialogTitle: 'Add to Apple Wallet',
        walletDetail: 'Apple Wallet share sheet opened',
        notificationTitleTemplate: 'Snapsist / {text}',
        notificationSubtitleDefault: 'demo notification',
        notificationBody: 'This notification is scheduled to arrive in 5 seconds to demonstrate every parameter.',
        notificationTriggerDefault: 'In 5s (TIME_INTERVAL)',
        notificationDetail: 'Arriving in 5s',
      },
    },
    batch: {
      titleTemplate: '{n} photos analyzed',
      subtitle: 'Choose what to save, then save them all at once — uncheck any you want to skip.',
      cancelButton: 'Cancel',
      saveButtonTemplate: 'Save {n}',
      categoryLabels: categoryLabels(['Business card', 'Receipt', 'Event', 'Document', 'Medication', 'Unknown']),
      actionContact: '→ Contacts',
      actionCalendar: '→ Calendar',
      actionNote: '→ Share to Notes',
      actionSkip: '→ Skipped',
      errorLabel: 'Error',
      skippedLabel: 'Skipped',
      noInfoDetail: 'No information detected',
      noteShareTitle: 'Snapsist Note',
    },
  },
  ko: {
    tabs: { demo: '데모', analyze: '분석', history: '기록', settings: '설정' },
    onboarding: {
      subtitle: '사진 한 장이면 충분해요.\n알맞은 앱에 자동으로 저장해드릴게요.',
      permissions: [
        { label: '카메라', hint: '사진 촬영' },
        { label: '사진 보관함', hint: '갤러리에서 선택' },
        { label: '연락처', hint: '명함 정보 저장' },
        { label: '캘린더', hint: '일정 자동 등록' },
        { label: '미리 알림', hint: '할 일 자동 등록' },
      ],
      note: '다음 화면에서 권한 팝업이 여러 번 뜹니다. 모두 허용해주셔야 기능이 정상 동작해요.',
      startButton: '권한 허용하고 시작하기',
      skipButton: '먼저 데모 써보기',
    },
    auth: {
      signupTitle: '계정 만들기',
      signupSubtitle: '무료로 시작하고, 언제든 Pro로 업그레이드하세요.',
      loginTitle: '로그인',
      loginSubtitle: 'Snapsist 계정으로 로그인하세요.',
      emailPlaceholder: '이메일',
      passwordPlaceholder: '비밀번호 (8자 이상)',
      signupButton: '계정 만들기',
      loginButton: '로그인',
      switchToLogin: '이미 계정이 있으신가요? 로그인',
      switchToSignup: '계정이 없으신가요? 가입하기',
    },
    pricing: {
      title: '심플한 요금제',
      betaNote: '베타 기간엔 Pro 기능도 전부 무료로 열려있어요.',
      mostPopular: '가장 인기',
      perMonth: '/ 월',
      freeName: '무료',
      freeDesc: '한번 써보고 싶은 분께',
      freeFeatures: ['월 15장 처리', '연락처 · 캘린더 · 미리 알림 · Wallet · 메모 · 지도', '기기 내 기록 저장'],
      freeCta: '무료로 시작하기',
      proDesc: '자주 쓰는 분께',
      proFeatures: ['무제한 처리', '여러 장 한번에 일괄 처리', '기록 클라우드 동기화', '우선 처리'],
      proCta: 'Pro 시작하기',
      tokenIntro: '명함·영수증·행사 전단은 토큰이 필요해요. 나머지는 전부 무료예요.',
      tier0FreeNote: '복약·문서·미인식 사진은 언제나 무료예요 — 토큰도, 계정도 필요 없어요.',
      tokensLabelTemplate: '토큰 {n}개',
      analysesEquivalentTemplate: '≈ {n}회 분석',
      buyButton: '구매',
    },
    account: {
      signedOutTitle: '로그인되어 있지 않아요',
      signedOutSubtitle: '가입하면 기록을 동기화하고 무료 토큰을 받을 수 있어요.',
      viewPricing: '요금제 보기 →',
      logout: '로그아웃',
      cancelPlanButton: 'Pro 해지',
      cancelPlanConfirmTitle: 'Pro 플랜을 해지할까요?',
      cancelPlanConfirmBody: '무료 플랜으로 전환돼요. 언제든 다시 업그레이드할 수 있어요.',
      cancelPlanDoneTitle: '해지 완료',
      cancelPlanDoneBody: '이제 무료 플랜이에요.',
      deleteAccountButton: '계정 삭제',
      deleteConfirmTitle: '계정을 삭제할까요?',
      deleteConfirmBody: '계정이 영구적으로 삭제돼요. 되돌릴 수 없어요.',
      tokenBalanceTemplate: '토큰 {n}개',
      buyTokens: '토큰 구매 →',
    },
    home: {
      subtitle: '사진 한 장 → 알맞은 앱에 자동 저장',
      quickDemoHeader: '빠른 데모',
      quickDemoSub: '버튼을 누르면 확인 화면이 바로 뜹니다',
      realAnalysisHeader: '사진으로 실제 분석',
      realAnalysisSub: 'AI가 알아서 읽고 정보를 추출해요',
      cameraButton: '📷 카메라로 촬영',
      galleryButton: '🖼️ 갤러리에서 선택',
      multiSelectButton: '🗂️ 여러 장 한번에 처리',
      multiSelectProgress: '{done}/{total}장 분석 중...',
      analyzeButton: '분석하기',
      permissionNeededTitle: '권한 필요',
      permissionNeededBody: '사진에 접근하려면 권한이 필요합니다.',
      demoButtons: demoKeys([
        ['명함 사진', '연락처에 저장'],
        ['이벤트 사진', '캘린더에 저장'],
        ['영수증 사진', '메모로 공유'],
        ['리마인더 사진', '미리 알림에 저장'],
        ['사진 저장', '앨범에 자동 저장'],
        ['메일 초안', '메일 앱 열기'],
        ['문자 초안', '문자 앱 열기'],
        ['위치 사진', '지도 앱 열기'],
        ['문서 저장', '파일로 공유'],
        ['패스 카드', 'Apple Wallet에 추가'],
        ['알림 예약', '5초 뒤 알림'],
      ]),
      batchDemoButton: { label: '일괄 업로드 데모', hint: '한번에 10장' },
      batchDemoRejectReason: '분류하지 못했어요 — 사진이 흐릿하거나 인식할 수 있는 글자가 없어요.',
      demoModeLabel: 'DEMO MODE (실제 API 키 없음)',
      classifyLabel: '분류: {category} ({confidence}%)',
      contactName: '이름',
      contactPhone: '전화',
      contactEmail: '이메일',
      contactCompany: '회사',
      calendarTitle: '제목',
      calendarLocation: '장소',
      calendarStart: '시작',
      medicationName: '약 이름',
      medicationDosage: '용량',
      medicationFrequencyTemplate: '1일 {n}회',
      medicationDurationTemplate: '{n}일간',
      medicationTimingBeforeMeal: '식전',
      medicationTimingAfterMeal: '식후',
      medicationTimingWithMeal: '식사와 함께',
      medicationTimingUnspecified: '시간 미지정',
      saveToContacts: '연락처에 저장',
      saveToCalendar: '캘린더에 저장',
      saveToReminder: '복용 알림 등록',
      saveDoneTitle: '저장 완료',
      saveContactDoneBody: '연락처 앱에 저장되었습니다.',
      saveCalendarDoneBody: '캘린더 앱에 일정이 추가되었습니다.',
      saveReminderDoneBodyTemplate: '{n}일간 매일 복용 알림이 등록되었습니다.',
      saveFailTitle: '저장 실패',
      timeConfirm: {
        title: '알림 시간 선택',
        subtitleMedication: '정확한 복용 시간이 적혀있지 않아요. 알림 받을 시간을 선택해주세요.',
        subtitleEvent: '사진에서 정확한 시간을 찾지 못했어요. 일정 시간을 선택해주세요.',
        doseLabelTemplate: '{n}회차',
        confirmButton: '확인하고 저장',
        cancelButton: '취소',
      },
      batchTitleTemplate: '{n}장 일괄 처리됨',
      batchSavedTo: '일괄 처리',
      batchDoneTitle: '완료',
      batchDoneBodyTemplate: '{n}장 처리 결과를 기록에 저장했어요.',
      limitExceededTitle: '무료 플랜 한도 초과',
      limitExceededBody: '이번 달 무료 플랜 한도인 {n}장을 초과했어요. Pro로 업그레이드하면 무제한으로 쓸 수 있어요.',
      layer0Unsupported: {
        title: '서버 분석으로 진행할까요?',
        bodyTemplate: '이 기기 또는 앱 버전에서는 온디바이스 분석을 사용할 수 없어요. 계속하면 사진이 서버로 전송되고 토큰 {n}개가 사용돼요. 계속할까요?',
        cancelButton: '취소',
        onceButton: '이번만 계속',
        alwaysButton: '항상 이렇게 진행',
      },
    },
    history: {
      title: '기록',
      clearAll: '전체 삭제',
      emptyText: '아직 저장한 게 없어요.\n홈에서 데모 버튼을 눌러보세요.',
      prev: '이전',
      next: '다음',
      closeButton: '닫기',
      replayButton: '다시 저장',
      replayNote: '실수로 지웠을 때, AI 재분석 없이 같은 값으로 다시 저장해요.',
      replayDoneTitle: '다시 저장됨',
      replayDoneBodyTemplate: '{savedTo}에 다시 반영했어요. AI 재분석 없이 이전 값 그대로 사용했어요.',
      failTitle: '실패',
      timeJustNow: '방금 전',
      timeMinutesAgo: '{n}분 전',
      timeHoursAgo: '{n}시간 전',
      timeDaysAgo: '{n}일 전',
      allTime: '전체',
      currentPeriod: '이번 청구 기간',
      previousPeriod: '지난 청구 기간',
      dateFilterLabel: '날짜로 필터링',
      datePlaceholder: 'YYYY-MM-DD',
      applyFilter: '적용',
      clearFilter: '초기화',
      dateFilterError: '유효한 날짜 범위를 입력해주세요 (시작일 ≤ 종료일).',
      noResultsForFilter: '이 기간에는 기록이 없어요.',
    },
    permissions: {
      title: '설정',
      subtitle: 'Snapsist가 사용 중인 권한 상태예요',
      items: [
        { label: '카메라', hint: '사진 촬영' },
        { label: '사진 보관함', hint: '갤러리에서 선택' },
        { label: '연락처', hint: '명함 정보 저장' },
        { label: '캘린더', hint: '일정 자동 등록' },
        { label: '미리 알림', hint: '할 일 자동 등록' },
      ],
      statusGranted: '허용됨',
      statusDenied: '거부됨',
      statusUndetermined: '미확인',
      statusChecking: '확인 중',
      grantButton: '권한 허용하기',
      notice: '거부된 권한은 앱에서 다시 요청해도 팝업이 안 뜰 수 있어요. 그럴 땐 아래 버튼으로 설정 앱에서 직접 켜주세요.',
      openSettingsButton: '설정 앱에서 열기',
      manageButton: '관리',
      legalTitle: '법적 고지',
      legalTerms: '이용약관',
      legalPrivacy: '개인정보처리방침',
      legalRefund: '환불 정책',
      legalChildSafety: '아동 안전 정책',
      languageTitle: '언어',
      layer0Title: '온디바이스 분석',
      layer0UnsupportedBody: '이 기기(또는 앱 버전)에서는 온디바이스 분석을 사용할 수 없어요. 대신 서버에서 사진을 분석하며, 이때 토큰이 사용돼요.',
      layer0ConsentedNote: '앞으로 묻지 않고 항상 서버 분석을 사용하는 것에 동의하셨어요.',
      layer0RevokeButton: '매번 다시 물어보기',
      layer0RevokedTitle: '완료',
      layer0RevokedBody: '앞으로 서버 분석을 사용하기 전에 다시 물어볼게요.',
    },
    review: {
      titles: reviewTitles([
        '명함 → 연락처',
        '이벤트 → 캘린더',
        '영수증 → 메모',
        '리마인더 → 미리 알림',
        '사진 → 갤러리',
        '메일 초안',
        '문자 초안',
        '위치 → 지도',
        '문서 → 파일',
        '패스 → Apple Wallet',
        '알림 예약',
      ]),
      subtitle: '아래 파라미터로 실행됩니다 — 확인 후 눌러주세요',
      executeLabel: '실행',
      shareLabel: '공유하기',
      receiptNote: 'Notes 앱은 공식 저장 API가 없어서, 확인 후 공유 시트에서 "메모"를 선택해주세요.',
      walletNote: '백엔드에서 서명된 .pkpass를 받아 공유 시트로 Wallet에 추가합니다. 인증서가 아직 설정 전이면 오류가 뜰 수 있어요.',
      cancelButton: '취소',
      saveDoneTitle: '완료',
      saveDoneBodyTemplate: '{savedTo}에 저장했어요.',
      failTitle: '실패',
      labels: {
        firstName: '이름',
        lastName: '성',
        middleName: 'Middle Name',
        prefixSuffix: 'Prefix / Suffix',
        mobile: '휴대폰',
        workEmail: '직장 이메일',
        companyDept: '회사 / 부서',
        jobTitle: '직함',
        birthday: '생일',
        workAddress: '직장 주소',
        homepage: '홈페이지',
        relation: '관계',
        social: 'SNS',
        note: '메모',
        title: '제목',
        location: '장소',
        startEnd: '시작 / 종료',
        allDay: '종일',
        notes: '메모',
        url: 'URL',
        timeZone: '시간대',
        availability: '가능 여부',
        alarm: '알림',
        recurrence: '반복',
        startDue: '시작 / 마감',
        completed: '완료 여부',
        saveAlbum: '저장 앨범',
        originalFile: '원본 파일',
        usedApi: '사용 API',
        recipients: '받는사람',
        cc: '참조(CC)',
        bcc: '숨은참조(BCC)',
        subject: '제목',
        body: '본문',
        attachment: '첨부파일',
        message: '메시지',
        placeName: '장소명',
        coordinates: '좌표',
        route: '경로',
        fileName: '파일명',
        saveLocation: '저장 위치',
        shareOptions: '공유 옵션',
        passType: 'Pass Type',
        organization: 'Organization',
        description: 'Description',
        primaryField: 'Primary Field',
        secondaryField: 'Secondary Field',
        barcode: 'Barcode',
        color: '색상',
        titleSubtitle: '제목 / 부제',
        badgeSound: '배지 / 사운드',
        importance: '중요도',
        trigger: '트리거',
      },
      demo: {
        eventTitleDefault: 'Snapsist 데모 이벤트',
        eventNotesAuto: '사진에서 자동으로 추출된 일정입니다.',
        eventStartEnd: '지금 ~ +1시간',
        eventTimeZone: '기기 설정값',
        eventAlarm: '시작 15분 전',
        eventRecurrence: '매주 반복, 4회',
        reminderTitleDefault: '우유 사기',
        reminderNotesAuto: 'Snapsist에서 사진으로 자동 등록된 할 일입니다.',
        reminderStartDue: '지금 / 지금',
        reminderAlarm: '마감 10분 전',
        receiptItem1: '아메리카노',
        receiptPrice1: '4,500원',
        receiptItem2: '크루아상',
        receiptPrice2: '3,800원',
        receiptTotal: '8,300원',
        receiptHeaderTemplate: '🧾 영수증 내역 ({date})',
        receiptTotalLabel: '합계',
        photoDetailTemplate: '앨범: {album}',
        photoOriginalFile: '데모 PNG (1×1)',
        contactNote: 'Snapsist 데모로 생성된 연락처입니다.',
        mailSubjectDefault: 'Snapsist 데모 메일',
        mailBodyFormat: 'HTML 형식 (isHtml: true)',
        mailBodyContent: '<b>Snapsist</b>에서 자동으로 채운 메일 초안입니다.',
        mailDetailTemplate: '상태: {status}',
        smsMessageDefault: 'Snapsist 데모 문자입니다.',
        smsDetailTemplate: '상태: {status}',
        filesSaveLocation: '문서 디렉토리 (Paths.document)',
        filesContentPrefix: 'Snapsist 데모 파일\n생성 시각: ',
        filesShareDialogTitle: 'Snapsist 파일 저장',
        filesDetail: '문서 디렉토리에 저장됨',
        walletDescriptionDefault: 'Snapsist 데모 패스',
        walletShareDialogTitle: 'Apple Wallet에 추가',
        walletDetail: 'Apple Wallet 공유 시트 열림',
        notificationTitleTemplate: 'Snapsist / {text}',
        notificationSubtitleDefault: '데모 알림',
        notificationBody: '이 알림은 모든 파라미터를 시연하기 위해 5초 후 도착하도록 예약됐어요.',
        notificationTriggerDefault: '5초 뒤 (TIME_INTERVAL)',
        notificationDetail: '5초 뒤 도착 예정',
      },
    },
    batch: {
      titleTemplate: '{n}장 분석 완료',
      subtitle: '저장할 항목을 선택하고 일괄 저장하세요 — 체크 해제하면 그 사진은 건너뜁니다',
      cancelButton: '취소',
      saveButtonTemplate: '{n}개 일괄 저장',
      categoryLabels: categoryLabels(['명함', '영수증', '이벤트', '문서', '복용 안내', '알 수 없음']),
      actionContact: '→ 연락처',
      actionCalendar: '→ 캘린더',
      actionNote: '→ 메모 공유',
      actionSkip: '→ 건너뜀',
      errorLabel: '오류',
      skippedLabel: '건너뜀',
      noInfoDetail: '인식된 정보 없음',
      noteShareTitle: 'Snapsist 노트',
    },
  },
  es: {
    tabs: { demo: 'Demo', analyze: 'Analizar', history: 'Historial', settings: 'Ajustes' },
    onboarding: {
      subtitle: 'Con una foto basta.\nLa archivaremos automáticamente en la app correcta.',
      permissions: [
        { label: 'Cámara', hint: 'Tomar fotos' },
        { label: 'Fototeca', hint: 'Elegir de la galería' },
        { label: 'Contactos', hint: 'Guardar tarjetas de presentación' },
        { label: 'Calendario', hint: 'Añadir eventos automáticamente' },
        { label: 'Recordatorios', hint: 'Añadir tareas automáticamente' },
      ],
      note: 'En la siguiente pantalla verás varios avisos de permisos — permítelos todos para que todo funcione.',
      startButton: 'Permitir y empezar',
      skipButton: 'Probar la demo primero',
    },
    auth: {
      signupTitle: 'Crea tu cuenta',
      signupSubtitle: 'Empieza gratis y mejora a Pro cuando quieras.',
      loginTitle: 'Iniciar sesión',
      loginSubtitle: 'Bienvenido de nuevo.',
      emailPlaceholder: 'Correo electrónico',
      passwordPlaceholder: 'Contraseña (8+ caracteres)',
      signupButton: 'Crear cuenta',
      loginButton: 'Iniciar sesión',
      switchToLogin: '¿Ya tienes una cuenta? Inicia sesión',
      switchToSignup: '¿No tienes una cuenta? Regístrate',
    },
    pricing: {
      title: 'Precios simples',
      betaNote: 'Durante la beta, las funciones Pro están desbloqueadas gratis para todos.',
      mostPopular: 'Más popular',
      perMonth: '/ mes',
      freeName: 'Gratis',
      freeDesc: 'Pruébalo sin compromiso',
      freeFeatures: [
        '15 fotos / mes',
        'Contactos · Calendario · Recordatorios · Wallet · Notas · Mapas',
        'Historial en el dispositivo',
      ],
      freeCta: 'Empezar gratis',
      proDesc: 'Para uso habitual',
      proFeatures: [
        'Fotos ilimitadas',
        'Procesa varias fotos a la vez',
        'Historial sincronizado entre dispositivos',
        'Procesamiento prioritario',
      ],
      proCta: 'Empezar con Pro',
      tokenIntro: 'Las tarjetas de presentación, recibos y carteles de eventos usan tokens. Todo lo demás es gratis.',
      tier0FreeNote: 'Medicamentos, documentos y fotos no reconocidas siempre son gratis — sin tokens ni cuenta.',
      tokensLabelTemplate: '{n} tokens',
      analysesEquivalentTemplate: '≈ {n} análisis',
      buyButton: 'Comprar',
    },
    account: {
      signedOutTitle: 'No has iniciado sesión',
      signedOutSubtitle: 'Regístrate para sincronizar tu historial y obtener tokens gratis.',
      viewPricing: 'Ver precios →',
      logout: 'Cerrar sesión',
      cancelPlanButton: 'Cancelar Pro',
      cancelPlanConfirmTitle: '¿Cancelar tu plan Pro?',
      cancelPlanConfirmBody: 'Pasarás al plan Free. Puedes volver a mejorar cuando quieras.',
      cancelPlanDoneTitle: 'Plan cancelado',
      cancelPlanDoneBody: 'Ahora estás en el plan Free.',
      deleteAccountButton: 'Eliminar cuenta',
      deleteConfirmTitle: '¿Eliminar tu cuenta?',
      deleteConfirmBody: 'Esto elimina tu cuenta de forma permanente. No se puede deshacer.',
      tokenBalanceTemplate: '{n} tokens',
      buyTokens: 'Comprar tokens →',
    },
    home: {
      subtitle: 'Una foto → archivada automáticamente en la app correcta',
      quickDemoHeader: 'Demo rápida',
      quickDemoSub: 'Toca un botón para ver la pantalla de revisión al instante',
      realAnalysisHeader: 'Analiza una foto real',
      realAnalysisSub: 'La IA descubre de qué se trata y extrae los detalles',
      cameraButton: '📷 Tomar una foto',
      galleryButton: '🖼️ Elegir de la galería',
      multiSelectButton: '🗂️ Procesar varias a la vez',
      multiSelectProgress: 'Analizando {done}/{total}...',
      analyzeButton: 'Analizar',
      permissionNeededTitle: 'Permiso necesario',
      permissionNeededBody: 'Se necesita acceso a tus fotos.',
      demoButtons: demoKeys([
        ['Tarjeta de presentación', 'Guardar en Contactos'],
        ['Cartel de evento', 'Guardar en Calendario'],
        ['Recibo', 'Compartir a Notas'],
        ['Nota de tarea', 'Guardar en Recordatorios'],
        ['Guardar foto', 'Guardar en el álbum'],
        ['Borrador de correo', 'Abrir Correo'],
        ['Borrador de SMS', 'Abrir Mensajes'],
        ['Foto con ubicación', 'Abrir Mapas'],
        ['Guardar documento', 'Compartir como archivo'],
        ['Tarjeta/pase', 'Añadir a Apple Wallet'],
        ['Programar alerta', 'Notificar en 5s'],
      ]),
      batchDemoButton: { label: 'Demo de carga por lotes', hint: '10 fotos a la vez' },
      batchDemoRejectReason: 'No se pudo clasificar — la imagen está borrosa o no tiene texto reconocible.',
      demoModeLabel: 'MODO DEMO (sin claves de API)',
      classifyLabel: 'Categoría: {category} ({confidence}%)',
      contactName: 'Nombre',
      contactPhone: 'Teléfono',
      contactEmail: 'Correo',
      contactCompany: 'Empresa',
      calendarTitle: 'Título',
      calendarLocation: 'Ubicación',
      calendarStart: 'Inicio',
      medicationName: 'Medicamento',
      medicationDosage: 'Dosis',
      medicationFrequencyTemplate: '{n} veces al día',
      medicationDurationTemplate: 'Tratamiento de {n} días',
      medicationTimingBeforeMeal: 'Antes de las comidas',
      medicationTimingAfterMeal: 'Después de las comidas',
      medicationTimingWithMeal: 'Con las comidas',
      medicationTimingUnspecified: 'Sin horario especificado',
      saveToContacts: 'Guardar en Contactos',
      saveToCalendar: 'Guardar en Calendario',
      saveToReminder: 'Configurar recordatorios',
      saveDoneTitle: 'Guardado',
      saveContactDoneBody: 'Se guardó en la app Contactos.',
      saveCalendarDoneBody: 'Se añadió el evento al Calendario.',
      saveReminderDoneBodyTemplate: 'Recordatorios diarios configurados durante {n} días.',
      saveFailTitle: 'Error al guardar',
      timeConfirm: {
        title: 'Confirmar hora del recordatorio',
        subtitleMedication: 'No se encontró una hora exacta en la etiqueta — elige cuándo quieres el recordatorio.',
        subtitleEvent: 'No se encontró una hora exacta en la foto — elige una hora para este evento.',
        doseLabelTemplate: 'Toma {n}',
        confirmButton: 'Confirmar y guardar',
        cancelButton: 'Cancelar',
      },
      batchTitleTemplate: '{n} fotos procesadas',
      batchSavedTo: 'Lote',
      batchDoneTitle: 'Listo',
      batchDoneBodyTemplate: 'Se guardaron los resultados de {n} fotos en el historial.',
      limitExceededTitle: 'Límite del plan Free alcanzado',
      limitExceededBody: 'Has alcanzado el límite de {n} fotos al mes del plan Free. Mejora a Pro para fotos ilimitadas.',
      layer0Unsupported: {
        title: '¿Usar el análisis del servidor?',
        bodyTemplate: 'El análisis en el dispositivo no está disponible en este dispositivo o versión de la app. Si continúas, la foto se enviará a nuestro servidor y se usarán {n} tokens. ¿Continuar?',
        cancelButton: 'Cancelar',
        onceButton: 'Solo esta vez',
        alwaysButton: 'Hacerlo siempre así',
      },
    },
    history: {
      title: 'Historial',
      clearAll: 'Borrar todo',
      emptyText: 'Aún no hay nada guardado.\nPrueba un botón de demo en Inicio.',
      prev: 'Anterior',
      next: 'Siguiente',
      closeButton: 'Cerrar',
      replayButton: 'Guardar de nuevo',
      replayNote: 'Si lo borraste sin querer, esto vuelve a guardar el mismo valor — sin usar la IA otra vez.',
      replayDoneTitle: 'Guardado de nuevo',
      replayDoneBodyTemplate: 'Se volvió a aplicar en {savedTo}, con los valores originales — sin volver a analizar.',
      failTitle: 'Error',
      timeJustNow: 'ahora mismo',
      timeMinutesAgo: 'hace {n} min',
      timeHoursAgo: 'hace {n} h',
      timeDaysAgo: 'hace {n} d',
      allTime: 'Todo',
      currentPeriod: 'Periodo actual',
      previousPeriod: 'Periodo anterior',
      dateFilterLabel: 'Filtrar por fecha',
      datePlaceholder: 'AAAA-MM-DD',
      applyFilter: 'Aplicar',
      clearFilter: 'Borrar',
      dateFilterError: 'Introduce un rango de fechas válido (desde ≤ hasta).',
      noResultsForFilter: 'No hay entradas en este periodo.',
    },
    permissions: {
      title: 'Ajustes',
      subtitle: 'Permisos que Snapsist está usando ahora mismo',
      items: [
        { label: 'Cámara', hint: 'Tomar fotos' },
        { label: 'Fototeca', hint: 'Elegir de la galería' },
        { label: 'Contactos', hint: 'Guardar tarjetas de presentación' },
        { label: 'Calendario', hint: 'Añadir eventos automáticamente' },
        { label: 'Recordatorios', hint: 'Añadir tareas automáticamente' },
      ],
      statusGranted: 'Permitido',
      statusDenied: 'Denegado',
      statusUndetermined: 'Sin confirmar',
      statusChecking: 'Comprobando',
      grantButton: 'Permitir',
      notice: 'Un permiso denegado puede no volver a preguntar — abre Ajustes para activarlo directamente.',
      openSettingsButton: 'Abrir la app de Ajustes',
      manageButton: 'Gestionar',
      legalTitle: 'Legal',
      legalTerms: 'Términos de uso',
      legalPrivacy: 'Política de privacidad',
      legalRefund: 'Política de reembolsos',
      legalChildSafety: 'Seguridad infantil',
      languageTitle: 'Idioma',
      layer0Title: 'Análisis en el dispositivo',
      layer0UnsupportedBody: 'Este dispositivo (o versión de la app) no puede ejecutar el análisis en el dispositivo. Las fotos se analizan en nuestro servidor en su lugar, lo que usa tokens.',
      layer0ConsentedNote: 'Aceptaste usar siempre el análisis del servidor sin que se te pregunte cada vez.',
      layer0RevokeButton: 'Preguntarme cada vez',
      layer0RevokedTitle: 'Listo',
      layer0RevokedBody: 'Volveremos a preguntarte antes de cada análisis que use el servidor.',
    },
    review: {
      titles: reviewTitles([
        'Tarjeta → Contactos',
        'Evento → Calendario',
        'Recibo → Notas',
        'Recordatorio → Recordatorios',
        'Foto → Galería',
        'Borrador de correo',
        'Borrador de SMS',
        'Ubicación → Mapas',
        'Documento → Archivos',
        'Pase → Apple Wallet',
        'Programar alerta',
      ]),
      subtitle: 'Se guardarán exactamente estos valores — revisa y confirma.',
      executeLabel: 'Guardar',
      shareLabel: 'Compartir',
      receiptNote: 'Apple no ofrece una API pública para Notas, así que después elige "Notas" en la hoja de compartir.',
      walletNote: 'Descarga un .pkpass firmado desde el backend. Puede fallar si el certificado aún no está configurado.',
      cancelButton: 'Cancelar',
      saveDoneTitle: 'Guardado',
      saveDoneBodyTemplate: 'Se guardó en {savedTo}.',
      failTitle: 'Error',
      labels: {
        firstName: 'Nombre',
        lastName: 'Apellido',
        middleName: 'Segundo nombre',
        prefixSuffix: 'Tratamiento',
        mobile: 'Móvil',
        workEmail: 'Correo del trabajo',
        companyDept: 'Empresa / Depto.',
        jobTitle: 'Cargo',
        birthday: 'Cumpleaños',
        workAddress: 'Dirección del trabajo',
        homepage: 'Sitio web',
        relation: 'Relación',
        social: 'Redes sociales',
        note: 'Nota',
        title: 'Título',
        location: 'Ubicación',
        startEnd: 'Inicio / Fin',
        allDay: 'Todo el día',
        notes: 'Notas',
        url: 'URL',
        timeZone: 'Zona horaria',
        availability: 'Disponibilidad',
        alarm: 'Alarma',
        recurrence: 'Repetición',
        startDue: 'Inicio / Vencimiento',
        completed: 'Completado',
        saveAlbum: 'Álbum',
        originalFile: 'Archivo original',
        usedApi: 'API usada',
        recipients: 'Para',
        cc: 'CC',
        bcc: 'CCO',
        subject: 'Asunto',
        body: 'Cuerpo',
        attachment: 'Adjunto',
        message: 'Mensaje',
        placeName: 'Lugar',
        coordinates: 'Coordenadas',
        route: 'Ruta',
        fileName: 'Nombre del archivo',
        saveLocation: 'Ubicación de guardado',
        shareOptions: 'Opciones para compartir',
        passType: 'Tipo de pase',
        organization: 'Organización',
        description: 'Descripción',
        primaryField: 'Campo principal',
        secondaryField: 'Campo secundario',
        barcode: 'Código de barras',
        color: 'Color',
        titleSubtitle: 'Título / Subtítulo',
        badgeSound: 'Insignia / Sonido',
        importance: 'Importancia',
        trigger: 'Disparador',
      },
      demo: {
        eventTitleDefault: 'Evento demo de Snapsist',
        eventNotesAuto: 'Extraído automáticamente de la foto.',
        eventStartEnd: 'Ahora ~ +1 hora',
        eventTimeZone: 'Valor predeterminado del dispositivo',
        eventAlarm: '15 min antes de empezar',
        eventRecurrence: 'Semanal, 4 veces',
        reminderTitleDefault: 'Comprar leche',
        reminderNotesAuto: 'Una tarea añadida automáticamente por Snapsist desde una foto.',
        reminderStartDue: 'Ahora / Ahora',
        reminderAlarm: '10 min antes del vencimiento',
        receiptItem1: 'Americano',
        receiptPrice1: '4,50 €',
        receiptItem2: 'Croissant',
        receiptPrice2: '3,80 €',
        receiptTotal: '8,30 €',
        receiptHeaderTemplate: '🧾 Recibo ({date})',
        receiptTotalLabel: 'Total',
        photoDetailTemplate: 'Álbum: {album}',
        photoOriginalFile: 'PNG de demo (1×1)',
        contactNote: 'Contacto creado por la demo de Snapsist.',
        mailSubjectDefault: 'Correo demo de Snapsist',
        mailBodyFormat: 'Formato HTML (isHtml: true)',
        mailBodyContent: '<b>Snapsist</b> completó automáticamente este borrador de correo.',
        mailDetailTemplate: 'Estado: {status}',
        smsMessageDefault: 'Este es un SMS de demostración de Snapsist.',
        smsDetailTemplate: 'Estado: {status}',
        filesSaveLocation: 'Directorio de documentos (Paths.document)',
        filesContentPrefix: 'Archivo demo de Snapsist\nCreado: ',
        filesShareDialogTitle: 'Guardar archivo de Snapsist',
        filesDetail: 'Guardado en el directorio de documentos',
        walletDescriptionDefault: 'Pase demo de Snapsist',
        walletShareDialogTitle: 'Añadir a Apple Wallet',
        walletDetail: 'Se abrió la hoja para compartir de Apple Wallet',
        notificationTitleTemplate: 'Snapsist / {text}',
        notificationSubtitleDefault: 'notificación demo',
        notificationBody: 'Esta notificación está programada para llegar en 5 segundos y demostrar todos los parámetros.',
        notificationTriggerDefault: 'En 5 s (TIME_INTERVAL)',
        notificationDetail: 'Llega en 5 s',
      },
    },
    batch: {
      titleTemplate: '{n} fotos analizadas',
      subtitle: 'Elige qué guardar y guárdalo todo junto — desmarca lo que quieras omitir.',
      cancelButton: 'Cancelar',
      saveButtonTemplate: 'Guardar {n}',
      categoryLabels: categoryLabels(['Tarjeta de presentación', 'Recibo', 'Evento', 'Documento', 'Medicación', 'Desconocido']),
      actionContact: '→ Contactos',
      actionCalendar: '→ Calendario',
      actionNote: '→ Compartir a Notas',
      actionSkip: '→ Omitido',
      errorLabel: 'Error',
      skippedLabel: 'Omitido',
      noInfoDetail: 'No se detectó información',
      noteShareTitle: 'Nota de Snapsist',
    },
  },
};

export function t(template: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, String(v)), template);
}
