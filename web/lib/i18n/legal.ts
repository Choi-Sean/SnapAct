import type { Locale } from './dictionaries';

export interface PolicySection {
  heading: string;
  body: string;
}

export interface PolicyDoc {
  title: string;
  updated: string;
  sections: PolicySection[];
}

export interface LegalDictionary {
  nav: { terms: string; privacy: string; refund: string; childSafety: string };
  terms: PolicyDoc;
  privacy: PolicyDoc;
  refund: PolicyDoc;
  childSafety: PolicyDoc;
}

export const legalDictionaries: Record<Locale, LegalDictionary> = {
  en: {
    nav: { terms: 'Terms of Use', privacy: 'Privacy Policy', refund: 'Refund Policy', childSafety: 'Child Safety' },
    terms: {
      title: 'Terms of Use',
      updated: 'Last updated: August 2026',
      sections: [
        {
          heading: 'Agreement to Terms',
          body: 'By using Snapsist ("the App"), you agree to these Terms of Use. If you don’t agree, please don’t use the App.',
        },
        {
          heading: 'What Snapsist does',
          body: 'Snapsist reads a photo you provide and helps you save the information it contains into apps already on your device — Contacts, Calendar, Reminders, Apple Wallet — or hands it off to Notes through the share sheet. You review and confirm every save before anything is written.',
        },
        {
          heading: 'Accounts',
          body: 'An account is optional and only needed for the Pro plan. You’re responsible for keeping your login credentials secure. You can delete your account and all associated data at any time from Settings in the app — deletion is immediate and permanent.',
        },
        {
          heading: 'Subscriptions (Pro plan)',
          body: 'Pro is a recurring monthly subscription that renews automatically at the price shown at signup until you cancel. Cancel anytime in Settings — cancellation takes effect immediately, you won’t be charged again, and you keep any time you’ve already paid for. During the current beta, Pro features are available to everyone at no charge.',
        },
        {
          heading: 'Fair use',
          body: 'Pro removes the Free plan’s 10-photo-a-month limit for normal individual use. It isn’t intended for automated, scripted, or bulk processing on someone else’s behalf. If we notice unusual usage, we’ll contact you before restricting anything — we don’t silently throttle real users.',
        },
        {
          heading: 'Your content',
          body: 'You keep ownership of your photos. We use them only to extract the information you asked for, then discard them — see our Privacy Policy. Don’t upload photos you don’t have the right to use, or that contain illegal content.',
        },
        {
          heading: 'No warranty',
          body: 'Snapsist is provided "as is." We aim for accurate reads, but you’re responsible for reviewing every result before it’s saved — the review screen exists specifically so a misread is never written silently.',
        },
        {
          heading: 'Changes to these Terms',
          body: 'We may update these Terms as the product evolves. We’ll update the date above whenever we do.',
        },
        { heading: 'Contact', body: 'Questions about these Terms? Email support@snapsist.app.' },
      ],
    },
    privacy: {
      title: 'Privacy Policy',
      updated: 'Last updated: August 2026',
      sections: [
        {
          heading: 'What we collect',
          body: 'Photos you choose to analyze (processed once, then discarded — see below), your email address if you create an account, and basic usage data (which features you use, error logs) to keep the app working.',
        },
        {
          heading: 'What we don’t collect',
          body: 'We don’t access your Contacts, Calendar, Reminders, or Photos except when you explicitly trigger a save — and even then, only the specific item involved, never your whole library.',
        },
        {
          heading: 'How photos are handled',
          body: 'A photo you submit is sent once to our backend, passed to Google Cloud Vision and Anthropic’s Claude API to extract information, then discarded. We don’t keep a copy or history of your photos on our servers. Your device’s local History is stored on your device, not ours — unless you’re on Pro, where History can sync across your devices, encrypted in transit.',
        },
        {
          heading: 'Third parties we use',
          body: 'Google Cloud Vision (classification/OCR) and Anthropic (structured data extraction) process photos on our behalf, under their own data-processing terms. We never sell your data to anyone.',
        },
        {
          heading: 'Your rights',
          body: 'Delete your account and all associated data anytime from Settings — it’s immediate and permanent. You can also request a copy of what we hold about you by emailing us.',
        },
        {
          heading: 'Children’s privacy',
          body: 'Snapsist isn’t directed at children under 13 (or the equivalent minimum age where you live), and we don’t knowingly collect personal information from them. If you believe a child has created an account, contact us and we’ll delete it.',
        },
        {
          heading: 'Security',
          body: 'We use industry-standard measures — encrypted connections, hashed passwords — to protect your data, but no system is 100% secure. Please use a strong, unique password.',
        },
        { heading: 'Changes to this policy', body: 'We’ll update the date above if this policy changes materially.' },
        { heading: 'Contact', body: 'privacy@snapsist.app' },
      ],
    },
    refund: {
      title: 'Refund Policy',
      updated: 'Last updated: August 2026',
      sections: [
        {
          heading: 'Current beta',
          body: 'Snapsist is free for everyone right now — Pro features are unlocked at no charge during the beta, so no payments are being collected yet. This policy describes what applies once billing goes live.',
        },
        {
          heading: 'Canceling',
          body: 'Cancel your Pro plan anytime from Settings. It takes effect immediately — you move to the Free plan and won’t be charged again.',
        },
        {
          heading: 'Refunds',
          body: 'We don’t refund the unused portion of a period you’ve already paid for. If you were charged in error — billed after canceling, charged twice — contact us and we’ll refund it.',
        },
        {
          heading: 'App Store purchases',
          body: 'If you subscribed through Apple’s App Store, refunds for that payment method are handled by Apple, not us — request one at reportaproblem.apple.com.',
        },
        {
          heading: 'How to request one',
          body: 'Email support@snapsist.app with your account email and the charge in question. We aim to respond within 5 business days.',
        },
      ],
    },
    childSafety: {
      title: 'Child Safety Standards',
      updated: 'Last updated: August 2026',
      sections: [
        {
          heading: 'No user-to-user content',
          body: 'Snapsist has no social features, messaging, or content sharing between users. Every photo you analyze is private to your account and never visible to anyone else.',
        },
        {
          heading: 'Zero tolerance',
          body: 'We have zero tolerance for child sexual abuse material (CSAM) or any content that endangers children. Snapsist isn’t designed or intended for use by children, and creating an account requires an email address.',
        },
        {
          heading: 'Reporting',
          body: 'If you become aware of any misuse of Snapsist involving a child’s safety, contact us immediately at safety@snapsist.app. We review every report and cooperate with law enforcement and organizations like NCMEC where required by law.',
        },
        {
          heading: 'Moderation',
          body: 'Photos are processed once and discarded, not stored on our servers (see our Privacy Policy) — so there’s no persistent content for us to host after processing. We still take every report seriously and will suspend or delete any account found to violate this policy.',
        },
        {
          heading: 'Age requirement',
          body: 'Snapsist isn’t directed at children under 13. See our Privacy Policy for details on children’s data.',
        },
        { heading: 'Contact', body: 'safety@snapsist.app' },
      ],
    },
  },
  ko: {
    nav: { terms: '이용약관', privacy: '개인정보처리방침', refund: '환불 정책', childSafety: '아동 안전 정책' },
    terms: {
      title: '이용약관',
      updated: '최종 수정일: 2026년 8월',
      sections: [
        { heading: '약관 동의', body: "Snapsist(이하 '앱')를 사용하면 본 이용약관에 동의하는 것으로 간주됩니다. 동의하지 않으시면 앱을 사용하지 마세요." },
        {
          heading: 'Snapsist가 하는 일',
          body: 'Snapsist는 사용자가 제공한 사진을 읽어서 그 안의 정보를 기기에 이미 설치된 앱(연락처, 캘린더, 미리 알림, Apple Wallet)에 저장하도록 돕거나, 공유 시트를 통해 메모 앱으로 넘겨줍니다. 무엇이든 저장되기 전에 항상 확인하고 승인하는 화면을 거칩니다.',
        },
        {
          heading: '계정',
          body: '계정은 선택 사항이며 Pro 플랜을 사용할 때만 필요합니다. 로그인 정보를 안전하게 보관할 책임은 사용자에게 있습니다. 앱의 설정에서 언제든지 계정과 관련 데이터를 삭제할 수 있으며, 삭제는 즉시 영구적으로 처리됩니다.',
        },
        {
          heading: '구독 (Pro 플랜)',
          body: 'Pro는 매월 자동으로 갱신되는 정기 구독으로, 가입 시 표시된 가격으로 해지 전까지 계속 갱신됩니다. 설정에서 언제든 해지할 수 있고, 해지는 즉시 적용되어 더 이상 청구되지 않으며 이미 결제한 기간은 그대로 이용할 수 있습니다. 현재 베타 기간에는 모든 사용자가 Pro 기능을 무료로 이용할 수 있습니다.',
        },
        {
          heading: '공정 이용',
          body: 'Pro 이용은 무료 플랜의 월 10장 제한을 일반적인 개인 사용 범위에서 없애줍니다. 자동화된 스크립트나 대량 처리, 타인을 대신한 처리 목적으로는 만들어지지 않았습니다. 비정상적인 사용 패턴이 감지되면 별도의 제한 조치 전에 반드시 먼저 연락드립니다 — 정상적인 사용자의 이용을 예고 없이 제한하지 않습니다.',
        },
        {
          heading: '콘텐츠 소유권',
          body: '사진의 소유권은 사용자에게 있습니다. 저희는 요청하신 정보를 추출하는 용도로만 사진을 사용한 뒤 즉시 폐기합니다 (개인정보처리방침 참고). 사용 권한이 없는 사진이나 불법적인 내용이 담긴 사진은 업로드하지 마세요.',
        },
        {
          heading: '보증하지 않음',
          body: "Snapsist는 '있는 그대로' 제공됩니다. 정확하게 읽어내려 최선을 다하지만, 저장되기 전에 결과를 확인할 책임은 사용자에게 있습니다 — 확인 화면은 바로 이런 오류가 조용히 저장되지 않도록 하기 위해 존재합니다.",
        },
        { heading: '약관 변경', body: '서비스가 발전함에 따라 본 약관을 수정할 수 있으며, 그때마다 위의 수정일을 갱신합니다.' },
        { heading: '문의', body: '약관에 대해 궁금한 점이 있으시면 support@snapsist.app으로 문의해주세요.' },
      ],
    },
    privacy: {
      title: '개인정보처리방침',
      updated: '최종 수정일: 2026년 8월',
      sections: [
        {
          heading: '수집하는 정보',
          body: '분석을 위해 선택한 사진(한 번 처리 후 즉시 폐기 — 아래 참고), 계정을 만든 경우 이메일 주소, 그리고 앱이 정상적으로 동작하도록 돕는 기본적인 사용 데이터(어떤 기능을 사용했는지, 오류 로그)를 수집합니다.',
        },
        {
          heading: '수집하지 않는 정보',
          body: '사용자가 직접 저장을 실행하지 않는 한 연락처, 캘린더, 미리 알림, 사진에 접근하지 않으며, 저장을 실행할 때도 해당 항목 하나만 접근하고 전체 라이브러리에는 접근하지 않습니다.',
        },
        {
          heading: '사진 처리 방식',
          body: '제출한 사진은 저희 서버로 한 번 전송되어 Google Cloud Vision과 Anthropic의 Claude API로 정보 추출을 위해 전달된 뒤 즉시 폐기됩니다. 서버에 사진의 사본이나 기록을 보관하지 않습니다. 기기 내 히스토리는 사용자의 기기에만 저장되며 저희 서버에는 저장되지 않습니다 — 단, Pro 플랜에서는 기기 간 히스토리 동기화가 가능하며, 전송 중 암호화됩니다.',
        },
        {
          heading: '이용하는 제3자 서비스',
          body: 'Google Cloud Vision(분류/OCR)과 Anthropic(구조화된 정보 추출)이 각자의 데이터 처리 약관에 따라 저희를 대신해 사진을 처리합니다. 어떤 경우에도 사용자의 데이터를 판매하지 않습니다.',
        },
        {
          heading: '사용자의 권리',
          body: '설정에서 언제든 계정과 관련 데이터를 삭제할 수 있으며, 즉시 영구적으로 처리됩니다. 이메일로 문의하시면 저희가 보유한 사용자 정보의 사본도 요청하실 수 있습니다.',
        },
        {
          heading: '아동 개인정보 보호',
          body: 'Snapsist는 만 13세 미만(또는 거주 국가의 해당 최소 연령) 아동을 대상으로 하지 않으며, 이들의 개인정보를 고의로 수집하지 않습니다. 아동이 계정을 만든 것으로 의심되면 문의해주세요 — 즉시 삭제하겠습니다.',
        },
        {
          heading: '보안',
          body: '암호화된 연결, 해시 처리된 비밀번호 등 업계 표준 수준의 보안 조치를 사용하지만, 100% 안전한 시스템은 없습니다. 강력하고 고유한 비밀번호를 사용해주세요.',
        },
        { heading: '방침 변경', body: '이 방침이 중요하게 변경되면 위의 수정일을 갱신합니다.' },
        { heading: '문의', body: 'privacy@snapsist.app' },
      ],
    },
    refund: {
      title: '환불 정책',
      updated: '최종 수정일: 2026년 8월',
      sections: [
        {
          heading: '현재 베타 기간',
          body: '현재 Snapsist는 모든 사용자에게 무료이며, 베타 기간 동안 Pro 기능도 무료로 제공되어 아직 결제가 발생하지 않습니다. 이 정책은 실제 결제가 시작된 이후에 적용될 내용을 설명합니다.',
        },
        { heading: '해지', body: '설정에서 언제든 Pro 플랜을 해지할 수 있어요. 해지는 즉시 적용되어 무료 플랜으로 전환되고 더 이상 청구되지 않습니다.' },
        {
          heading: '환불',
          body: '이미 결제한 기간 중 사용하지 않은 부분에 대해서는 환불하지 않습니다. 해지 후에도 청구되었거나 중복 청구된 경우처럼 오류로 결제된 경우에는 문의해주시면 환불해드립니다.',
        },
        {
          heading: 'App Store 결제',
          body: 'Apple App Store를 통해 구독하신 경우, 해당 결제 수단의 환불은 저희가 아니라 Apple이 처리합니다 — reportaproblem.apple.com에서 요청해주세요.',
        },
        {
          heading: '환불 요청 방법',
          body: '계정 이메일과 해당 결제 내역을 포함해 support@snapsist.app으로 메일 보내주세요. 영업일 기준 5일 이내 답변드리는 것을 목표로 하고 있습니다.',
        },
      ],
    },
    childSafety: {
      title: '아동 안전 정책',
      updated: '최종 수정일: 2026년 8월',
      sections: [
        {
          heading: '사용자 간 콘텐츠 없음',
          body: 'Snapsist에는 소셜 기능, 메시지, 사용자 간 콘텐츠 공유가 없습니다. 분석한 모든 사진은 해당 계정에만 비공개로 남으며 다른 사용자에게 절대 노출되지 않습니다.',
        },
        {
          heading: '무관용 원칙',
          body: '아동 성 착취물(CSAM)이나 아동에게 위해가 되는 어떤 콘텐츠도 절대 용인하지 않습니다. Snapsist는 아동이 사용하도록 설계되거나 의도된 서비스가 아니며, 계정을 만들려면 이메일 주소가 필요합니다.',
        },
        {
          heading: '신고',
          body: '아동 안전과 관련해 Snapsist가 오용되는 것을 알게 되시면 즉시 safety@snapsist.app으로 연락해주세요. 모든 신고를 검토하며, 법적으로 요구되는 경우 법 집행기관 및 NCMEC 같은 기관과 협력합니다.',
        },
        {
          heading: '모니터링',
          body: '사진은 한 번 처리된 후 즉시 폐기되며 저희 서버에 저장되지 않습니다(개인정보처리방침 참고) — 그래서 처리 이후 저희가 계속 보관하며 검토할 콘텐츠 자체가 없습니다. 그럼에도 모든 신고를 진지하게 받아들이며, 이 정책을 위반한 것으로 확인된 계정은 정지하거나 삭제합니다.',
        },
        { heading: '연령 제한', body: 'Snapsist는 만 13세 미만 아동을 대상으로 하지 않습니다. 아동 데이터에 대한 자세한 내용은 개인정보처리방침을 참고해주세요.' },
        { heading: '문의', body: 'safety@snapsist.app' },
      ],
    },
  },
  ja: {
    nav: { terms: '利用規約', privacy: 'プライバシーポリシー', refund: '返金ポリシー', childSafety: '児童保護' },
    terms: {
      title: '利用規約',
      updated: '最終更新日：2026年8月',
      sections: [
        {
          heading: '規約への同意',
          body: '本アプリ「Snapsist」を利用することで、本利用規約に同意したものとみなされます。同意されない場合は、本アプリをご利用にならないでください。',
        },
        {
          heading: 'Snapsistが行うこと',
          body: 'Snapsistは、ユーザーが提供した写真を読み取り、そこに含まれる情報をすでに端末にあるアプリ（連絡先、カレンダー、リマインダー、Apple Wallet）に保存するお手伝いをするか、共有シートを通じてメモアプリに引き渡します。保存前には必ず確認画面が表示され、内容を確認・承認していただきます。',
        },
        {
          heading: 'アカウント',
          body: 'アカウントは任意で、Proプランを利用する場合にのみ必要です。ログイン情報の管理はユーザーの責任で行ってください。アプリの設定からいつでもアカウントと関連データを削除でき、削除は即時かつ完全に行われます。',
        },
        {
          heading: 'サブスクリプション（Proプラン）',
          body: 'Proは毎月自動更新される定期購読で、解約するまで登録時に表示された価格で更新され続けます。設定からいつでも解約可能で、解約は即時に適用され、以後の請求は発生せず、すでに支払い済みの期間はそのまま利用できます。現在のベータ期間中は、すべてのユーザーがProの機能を無料でご利用いただけます。',
        },
        {
          heading: '公正利用',
          body: 'Proは通常の個人利用において、無料プランの月10枚制限を撤廃するものです。自動化・スクリプトによる処理や、他人の代わりに大量処理する目的では想定されていません。通常とは異なる利用が確認された場合、制限を行う前に必ずご連絡します — 正当な利用者の利用を無断で制限することはありません。',
        },
        {
          heading: 'あなたのコンテンツ',
          body: '写真の所有権はユーザーにあります。ご要望の情報を抽出する目的にのみ写真を使用し、その後すぐに破棄します（プライバシーポリシーをご参照ください）。利用権のない写真や、違法な内容を含む写真はアップロードしないでください。',
        },
        {
          heading: '保証の否認',
          body: 'Snapsistは「現状のまま」提供されます。正確な読み取りに努めていますが、保存前に結果を確認する責任はユーザーにあります — 確認画面は、誤読がそのまま気づかれずに保存されるのを防ぐために存在します。',
        },
        { heading: '規約の変更', body: 'サービスの発展に伴い、本規約を更新する場合があります。更新時には上記の日付を改定します。' },
        { heading: 'お問い合わせ', body: '本規約についてのご質問は support@snapsist.app までご連絡ください。' },
      ],
    },
    privacy: {
      title: 'プライバシーポリシー',
      updated: '最終更新日：2026年8月',
      sections: [
        {
          heading: '収集する情報',
          body: '分析のために選択した写真（一度処理した後すぐに破棄 — 下記参照）、アカウント作成時のメールアドレス、アプリを正常に動作させるための基本的な利用データ（使用した機能、エラーログ）を収集します。',
        },
        {
          heading: '収集しない情報',
          body: 'ユーザーが明示的に保存操作を行った場合を除き、連絡先・カレンダー・リマインダー・写真にアクセスすることはありません。保存操作時も、該当する項目のみにアクセスし、ライブラリ全体にはアクセスしません。',
        },
        {
          heading: '写真の取り扱い',
          body: '送信された写真は一度だけ弊社サーバーに送られ、Google Cloud VisionおよびAnthropicのClaude APIに渡されて情報抽出が行われた後、破棄されます。弊社サーバーに写真のコピーや履歴を保持することはありません。端末内の履歴は端末のみに保存され、弊社サーバーには保存されません — ただしProプランでは、履歴をデバイス間で同期でき、通信中は暗号化されます。',
        },
        {
          heading: '利用する第三者サービス',
          body: 'Google Cloud Vision（分類・OCR）とAnthropic（構造化データの抽出）が、それぞれのデータ処理規約のもとで弊社に代わって写真を処理します。ユーザーのデータを第三者に販売することは一切ありません。',
        },
        {
          heading: 'ユーザーの権利',
          body: '設定からいつでもアカウントと関連データを削除でき、削除は即時かつ完全に行われます。メールでご連絡いただければ、弊社が保持する情報のコピーもご請求いただけます。',
        },
        {
          heading: 'お子様のプライバシー',
          body: 'Snapsistは13歳未満（またはお住まいの地域における同等の最低年齢）のお子様を対象としておらず、意図的に個人情報を収集することはありません。お子様がアカウントを作成したと思われる場合はご連絡ください。速やかに削除いたします。',
        },
        {
          heading: 'セキュリティ',
          body: '暗号化された通信やハッシュ化されたパスワードなど、業界標準のセキュリティ対策を講じていますが、完全に安全なシステムは存在しません。強力で固有のパスワードをご使用ください。',
        },
        { heading: 'ポリシーの変更', body: '本ポリシーに重要な変更があった場合、上記の日付を更新します。' },
        { heading: 'お問い合わせ', body: 'privacy@snapsist.app' },
      ],
    },
    refund: {
      title: '返金ポリシー',
      updated: '最終更新日：2026年8月',
      sections: [
        {
          heading: '現在のベータ期間について',
          body: '現在Snapsistはすべてのユーザーに無料で提供されており、ベータ期間中はProの機能も無料でご利用いただけるため、まだ支払いは発生していません。本ポリシーは、課金が開始された後に適用される内容を説明するものです。',
        },
        { heading: '解約', body: '設定からいつでもProプランを解約できます。解約は即時に適用され、無料プランに切り替わり、以後請求されることはありません。' },
        {
          heading: '返金',
          body: 'すでにお支払い済みの期間のうち、未使用分についての返金は行いません。解約後に請求された、二重に請求されたなど、誤って課金された場合はご連絡いただければ返金いたします。',
        },
        {
          heading: 'App Storeでのご購入',
          body: 'Apple App Store経由でご登録の場合、その支払い方法に対する返金は弊社ではなくAppleが対応します — reportaproblem.apple.com からご請求ください。',
        },
        {
          heading: '返金のご請求方法',
          body: 'アカウントのメールアドレスと該当する請求内容を添えて support@snapsist.app までメールをお送りください。5営業日以内の返信を目指しています。',
        },
      ],
    },
    childSafety: {
      title: '児童保護に関する方針',
      updated: '最終更新日：2026年8月',
      sections: [
        {
          heading: 'ユーザー間のコンテンツはありません',
          body: 'Snapsistにはソーシャル機能、メッセージ機能、ユーザー間のコンテンツ共有はありません。分析した写真はすべてそのアカウント内で非公開に保たれ、他のユーザーに表示されることは一切ありません。',
        },
        {
          heading: 'ゼロ・トレランス方針',
          body: '児童性的虐待コンテンツ（CSAM）や児童に危害を及ぼすいかなるコンテンツも一切許容しません。Snapsistは児童による利用を想定・意図しておらず、アカウント作成にはメールアドレスが必要です。',
        },
        {
          heading: '通報',
          body: '児童の安全に関わるSnapsistの不正利用にお気づきの場合は、直ちに safety@snapsist.app までご連絡ください。すべての通報を確認し、法律で求められる場合は法執行機関やNCMECのような組織と協力します。',
        },
        {
          heading: 'モニタリング',
          body: '写真は一度処理された後すぐに破棄され、弊社サーバーには保存されません（プライバシーポリシー参照）— そのため処理後に弊社が保持・確認し続けるコンテンツ自体が存在しません。それでもすべての通報を真剣に受け止め、本方針への違反が確認されたアカウントは停止または削除します。',
        },
        { heading: '年齢制限', body: 'Snapsistは13歳未満のお子様を対象としていません。お子様のデータについての詳細はプライバシーポリシーをご参照ください。' },
        { heading: 'お問い合わせ', body: 'safety@snapsist.app' },
      ],
    },
  },
  zh: {
    nav: { terms: '使用条款', privacy: '隐私政策', refund: '退款政策', childSafety: '儿童安全' },
    terms: {
      title: '使用条款',
      updated: '最后更新：2026年8月',
      sections: [
        { heading: '接受条款', body: '使用 Snapsist（以下简称"本应用"）即表示您同意本使用条款。如果您不同意，请不要使用本应用。' },
        {
          heading: 'Snapsist 的功能',
          body: 'Snapsist 读取您提供的照片，帮助您把其中的信息保存到手机已有的应用中——通讯录、日历、提醒事项、Apple Wallet，或通过分享面板转交给备忘录应用。在任何内容写入之前，您都会先看到确认屏幕并需要确认。',
        },
        {
          heading: '账户',
          body: '账户是可选的，仅在使用 Pro 套餐时才需要。您需自行妥善保管登录凭证。您可以随时在应用的设置中删除账户及相关数据，删除会立即且永久生效。',
        },
        {
          heading: '订阅（Pro 套餐）',
          body: 'Pro 是按月自动续订的订阅服务，会按注册时显示的价格持续续订，直到您取消为止。您可以随时在设置中取消，取消立即生效，之后不会再被扣费，已支付的时长仍可继续使用。当前测试期间，所有用户均可免费使用 Pro 功能。',
        },
        {
          heading: '合理使用',
          body: 'Pro 取消了免费版每月 10 张照片的限制，适用于正常的个人使用场景，并非为自动化脚本或代人批量处理而设计。如果发现异常使用情况，我们会先联系您，再考虑是否限制——不会在不通知的情况下限制正常用户。',
        },
        {
          heading: '您的内容',
          body: '照片的所有权归您所有。我们仅将其用于提取您所需的信息，随后立即删除——详见隐私政策。请勿上传您无权使用或包含违法内容的照片。',
        },
        {
          heading: '不提供担保',
          body: 'Snapsist 按"现状"提供。我们会尽力准确识别内容，但在保存前审核结果是您的责任——确认屏幕的存在正是为了避免识别错误在未经确认的情况下被悄悄保存。',
        },
        { heading: '条款变更', body: '随着产品的发展，我们可能会更新本条款，更新时会同步修改上方的更新日期。' },
        { heading: '联系方式', body: '如对本条款有任何疑问，请发邮件至 support@snapsist.app。' },
      ],
    },
    privacy: {
      title: '隐私政策',
      updated: '最后更新：2026年8月',
      sections: [
        {
          heading: '我们收集的信息',
          body: '您选择分析的照片（处理一次后立即删除，见下文）、如果创建账户则包括您的邮箱地址，以及维持应用正常运行所需的基本使用数据（使用了哪些功能、错误日志）。',
        },
        {
          heading: '我们不会收集的信息',
          body: '除非您主动触发保存操作，否则我们不会访问您的通讯录、日历、提醒事项或照片；即使在保存时，也只会访问涉及的具体项目，而不会访问您的整个媒体库。',
        },
        {
          heading: '照片的处理方式',
          body: '您提交的照片会被发送到我们的服务器一次，交给 Google Cloud Vision 和 Anthropic 的 Claude API 用于提取信息，随后立即删除。我们不会在服务器上保留照片的副本或记录。设备上的本地历史记录仅保存在您的设备上，不会保存在我们的服务器上——除非您使用 Pro 套餐，此时历史记录可在您的设备间同步，传输过程会加密。',
        },
        {
          heading: '我们使用的第三方服务',
          body: 'Google Cloud Vision（分类/OCR）和 Anthropic（结构化数据提取）会依据各自的数据处理条款代表我们处理照片。我们绝不会将您的数据出售给任何人。',
        },
        {
          heading: '您的权利',
          body: '您可以随时在设置中删除账户及相关数据，删除会立即且永久生效。您也可以通过邮件向我们索取我们所保存的关于您的信息副本。',
        },
        {
          heading: '儿童隐私',
          body: 'Snapsist 并非面向 13 岁以下（或您所在地区规定的相应最低年龄）的儿童，我们不会故意收集他们的个人信息。如果您认为有儿童创建了账户，请联系我们，我们会将其删除。',
        },
        {
          heading: '安全性',
          body: '我们采用行业标准的安全措施（加密连接、密码哈希处理）来保护您的数据，但没有任何系统能做到100%安全，请使用强度高且唯一的密码。',
        },
        { heading: '政策变更', body: '如果本政策发生重大变更，我们会更新上方的日期。' },
        { heading: '联系方式', body: 'privacy@snapsist.app' },
      ],
    },
    refund: {
      title: '退款政策',
      updated: '最后更新：2026年8月',
      sections: [
        {
          heading: '当前测试期间',
          body: '目前 Snapsist 对所有用户免费，测试期间 Pro 功能也是免费开放，因此尚未产生任何收费。本政策描述的是正式开始计费后将适用的内容。',
        },
        { heading: '取消订阅', body: '您可以随时在设置中取消 Pro 套餐，取消会立即生效——您将切换回免费版，且不会再被扣费。' },
        {
          heading: '退款',
          body: '对于您已支付但尚未使用完的部分，我们不提供退款。如果您被误扣费（例如取消后仍被扣费、或被重复扣费），请联系我们，我们会为您退款。',
        },
        {
          heading: '通过 App Store 购买',
          body: '如果您是通过 Apple App Store 订阅的，该支付方式的退款由 Apple 而非我们处理——请前往 reportaproblem.apple.com 申请。',
        },
        { heading: '如何申请退款', body: '请发邮件至 support@snapsist.app，注明您的账户邮箱及相关扣费信息。我们会尽量在 5 个工作日内回复。' },
      ],
    },
    childSafety: {
      title: '儿童安全标准',
      updated: '最后更新：2026年8月',
      sections: [
        {
          heading: '没有用户间内容',
          body: 'Snapsist 没有社交功能、消息功能，也不存在用户之间的内容分享。您分析的每张照片都仅对您的账户私密可见，绝不会展示给其他用户。',
        },
        {
          heading: '零容忍',
          body: '我们对儿童性虐待材料（CSAM）或任何危害儿童安全的内容采取零容忍态度。Snapsist 并非为儿童使用而设计或提供，创建账户需要提供邮箱地址。',
        },
        {
          heading: '举报',
          body: '如果您发现任何涉及儿童安全的 Snapsist 滥用行为，请立即联系 safety@snapsist.app。我们会审查每一份举报，并在法律要求时与执法机构及 NCMEC 等组织合作。',
        },
        {
          heading: '内容监管',
          body: '照片只会被处理一次然后立即删除，不会保存在我们的服务器上（详见隐私政策）——因此处理完成后，我们并没有可持续留存、审查的内容。即便如此，我们仍会认真对待每一份举报，并对被认定违反本政策的账户予以暂停或删除。',
        },
        { heading: '年龄要求', body: 'Snapsist 并非面向 13 岁以下儿童。关于儿童数据的详细信息，请参阅我们的隐私政策。' },
        { heading: '联系方式', body: 'safety@snapsist.app' },
      ],
    },
  },
  es: {
    nav: { terms: 'Términos de uso', privacy: 'Política de privacidad', refund: 'Política de reembolsos', childSafety: 'Seguridad infantil' },
    terms: {
      title: 'Términos de uso',
      updated: 'Última actualización: agosto de 2026',
      sections: [
        {
          heading: 'Aceptación de los términos',
          body: 'Al usar Snapsist (la "App"), aceptas estos Términos de uso. Si no estás de acuerdo, por favor no uses la App.',
        },
        {
          heading: 'Qué hace Snapsist',
          body: 'Snapsist lee una foto que proporcionas y te ayuda a guardar la información que contiene en apps que ya tienes en tu dispositivo — Contactos, Calendario, Recordatorios, Apple Wallet — o la entrega a Notas mediante la hoja de compartir. Revisas y confirmas cada guardado antes de que se escriba nada.',
        },
        {
          heading: 'Cuentas',
          body: 'Crear una cuenta es opcional y solo se necesita para el plan Pro. Eres responsable de mantener seguras tus credenciales de acceso. Puedes eliminar tu cuenta y todos los datos asociados en cualquier momento desde Ajustes en la app — la eliminación es inmediata y permanente.',
        },
        {
          heading: 'Suscripciones (plan Pro)',
          body: 'Pro es una suscripción mensual recurrente que se renueva automáticamente al precio mostrado al registrarte, hasta que la canceles. Cancela cuando quieras desde Ajustes — la cancelación es inmediata, no se te volverá a cobrar, y conservas el tiempo que ya pagaste. Durante la beta actual, las funciones Pro están disponibles para todos sin coste.',
        },
        {
          heading: 'Uso justo',
          body: 'Pro elimina el límite de 10 fotos al mes del plan Free para uso individual normal. No está pensado para procesamiento automatizado, con scripts, o masivo en nombre de otra persona. Si detectamos un uso inusual, te contactaremos antes de restringir nada — no limitamos a usuarios reales sin avisar.',
        },
        {
          heading: 'Tu contenido',
          body: 'Conservas la propiedad de tus fotos. Las usamos solo para extraer la información que pediste y luego las descartamos — consulta nuestra Política de privacidad. No subas fotos que no tengas derecho a usar, ni que contengan contenido ilegal.',
        },
        {
          heading: 'Sin garantía',
          body: 'Snapsist se proporciona "tal cual". Nos esforzamos por leer con precisión, pero eres responsable de revisar cada resultado antes de guardarlo — la pantalla de revisión existe precisamente para que una lectura errónea nunca se guarde sin que te des cuenta.',
        },
        { heading: 'Cambios en estos términos', body: 'Podemos actualizar estos Términos a medida que el producto evoluciona. Actualizaremos la fecha de arriba cuando lo hagamos.' },
        { heading: 'Contacto', body: '¿Dudas sobre estos Términos? Escribe a support@snapsist.app.' },
      ],
    },
    privacy: {
      title: 'Política de privacidad',
      updated: 'Última actualización: agosto de 2026',
      sections: [
        {
          heading: 'Qué recopilamos',
          body: 'Las fotos que eliges analizar (se procesan una vez y luego se descartan — ver más abajo), tu correo electrónico si creas una cuenta, y datos básicos de uso (qué funciones usas, registros de errores) para mantener la app funcionando.',
        },
        {
          heading: 'Qué no recopilamos',
          body: 'No accedemos a tus Contactos, Calendario, Recordatorios ni Fotos salvo cuando activas explícitamente un guardado — e incluso entonces, solo el elemento concreto implicado, nunca toda tu biblioteca.',
        },
        {
          heading: 'Cómo se tratan las fotos',
          body: 'Una foto que envías se manda una sola vez a nuestro servidor, se pasa a Google Cloud Vision y a la API Claude de Anthropic para extraer información, y luego se descarta. No conservamos copia ni historial de tus fotos en nuestros servidores. El Historial local de tu dispositivo se guarda solo en tu dispositivo, no en los nuestros — salvo si tienes Pro, donde el Historial puede sincronizarse entre tus dispositivos, cifrado en tránsito.',
        },
        {
          heading: 'Terceros que usamos',
          body: 'Google Cloud Vision (clasificación/OCR) y Anthropic (extracción de datos estructurados) procesan fotos en nuestro nombre, bajo sus propios términos de tratamiento de datos. Nunca vendemos tus datos a nadie.',
        },
        {
          heading: 'Tus derechos',
          body: 'Elimina tu cuenta y todos los datos asociados cuando quieras desde Ajustes — es inmediato y permanente. También puedes solicitarnos por correo una copia de lo que guardamos sobre ti.',
        },
        {
          heading: 'Privacidad de menores',
          body: 'Snapsist no está dirigida a menores de 13 años (o la edad mínima equivalente donde vivas), y no recopilamos a sabiendas información personal suya. Si crees que un menor ha creado una cuenta, contáctanos y la eliminaremos.',
        },
        {
          heading: 'Seguridad',
          body: 'Usamos medidas estándar del sector — conexiones cifradas, contraseñas con hash — para proteger tus datos, pero ningún sistema es 100% seguro. Usa una contraseña fuerte y única.',
        },
        { heading: 'Cambios en esta política', body: 'Actualizaremos la fecha de arriba si esta política cambia de forma sustancial.' },
        { heading: 'Contacto', body: 'privacy@snapsist.app' },
      ],
    },
    refund: {
      title: 'Política de reembolsos',
      updated: 'Última actualización: agosto de 2026',
      sections: [
        {
          heading: 'Beta actual',
          body: 'Snapsist es gratis para todos ahora mismo — las funciones Pro están desbloqueadas sin coste durante la beta, así que todavía no se está cobrando nada. Esta política describe lo que aplicará cuando empiece la facturación.',
        },
        { heading: 'Cancelación', body: 'Cancela tu plan Pro cuando quieras desde Ajustes. Es inmediato — pasas al plan Free y no se te vuelve a cobrar.' },
        {
          heading: 'Reembolsos',
          body: 'No reembolsamos la parte no utilizada de un periodo que ya has pagado. Si te cobraron por error — facturado tras cancelar, cobro duplicado — contáctanos y te lo reembolsaremos.',
        },
        {
          heading: 'Compras en la App Store',
          body: 'Si te suscribiste a través de la App Store de Apple, los reembolsos de ese método de pago los gestiona Apple, no nosotros — solicítalo en reportaproblem.apple.com.',
        },
        { heading: 'Cómo solicitarlo', body: 'Escribe a support@snapsist.app con el correo de tu cuenta y el cargo en cuestión. Intentamos responder en un plazo de 5 días hábiles.' },
      ],
    },
    childSafety: {
      title: 'Normas de seguridad infantil',
      updated: 'Última actualización: agosto de 2026',
      sections: [
        {
          heading: 'Sin contenido entre usuarios',
          body: 'Snapsist no tiene funciones sociales, mensajería ni contenido compartido entre usuarios. Cada foto que analizas es privada de tu cuenta y nunca es visible para nadie más.',
        },
        {
          heading: 'Tolerancia cero',
          body: 'Tenemos tolerancia cero con material de abuso sexual infantil (CSAM) o cualquier contenido que ponga en peligro a menores. Snapsist no está diseñada ni pensada para que la usen menores, y crear una cuenta requiere un correo electrónico.',
        },
        {
          heading: 'Cómo denunciar',
          body: 'Si tienes conocimiento de cualquier uso indebido de Snapsist relacionado con la seguridad de un menor, contáctanos de inmediato en safety@snapsist.app. Revisamos cada denuncia y colaboramos con las autoridades y organizaciones como NCMEC cuando la ley lo exige.',
        },
        {
          heading: 'Moderación',
          body: 'Las fotos se procesan una vez y se descartan, sin almacenarse en nuestros servidores (ver Política de privacidad) — así que no hay contenido persistente que podamos alojar tras el procesamiento. Aun así, nos tomamos en serio cada denuncia y suspenderemos o eliminaremos cualquier cuenta que infrinja esta política.',
        },
        { heading: 'Requisito de edad', body: 'Snapsist no está dirigida a menores de 13 años. Consulta nuestra Política de privacidad para más detalles sobre los datos de menores.' },
        { heading: 'Contacto', body: 'safety@snapsist.app' },
      ],
    },
  },
  fr: {
    nav: { terms: "Conditions d'utilisation", privacy: 'Politique de confidentialité', refund: 'Politique de remboursement', childSafety: 'Sécurité des enfants' },
    terms: {
      title: "Conditions d'utilisation",
      updated: 'Dernière mise à jour : août 2026',
      sections: [
        {
          heading: 'Acceptation des conditions',
          body: 'En utilisant Snapsist (« l’App »), vous acceptez les présentes Conditions d’utilisation. Si vous n’êtes pas d’accord, merci de ne pas utiliser l’App.',
        },
        {
          heading: 'Ce que fait Snapsist',
          body: 'Snapsist lit une photo que vous fournissez et vous aide à enregistrer les informations qu’elle contient dans des applications déjà présentes sur votre appareil — Contacts, Calendrier, Rappels, Apple Wallet — ou les transmet à Notes via la feuille de partage. Vous vérifiez et confirmez chaque enregistrement avant que quoi que ce soit ne soit écrit.',
        },
        {
          heading: 'Comptes',
          body: 'La création d’un compte est facultative et n’est nécessaire que pour le forfait Pro. Vous êtes responsable de la sécurité de vos identifiants. Vous pouvez supprimer votre compte et toutes les données associées à tout moment depuis Réglages dans l’app — la suppression est immédiate et définitive.',
        },
        {
          heading: 'Abonnements (forfait Pro)',
          body: 'Pro est un abonnement mensuel récurrent qui se renouvelle automatiquement au prix affiché lors de l’inscription, jusqu’à ce que vous l’annuliez. Annulez à tout moment depuis Réglages — l’annulation prend effet immédiatement, vous ne serez plus facturé, et vous conservez la période déjà payée. Pendant la bêta actuelle, les fonctionnalités Pro sont accessibles gratuitement à tous.',
        },
        {
          heading: 'Utilisation raisonnable',
          body: 'Pro supprime la limite de 10 photos par mois du forfait Free pour un usage individuel normal. Ce n’est pas prévu pour un traitement automatisé, scripté, ou en masse pour le compte d’un tiers. Si nous constatons un usage inhabituel, nous vous contacterons avant toute restriction — nous ne limitons jamais un utilisateur réel sans le prévenir.',
        },
        {
          heading: 'Votre contenu',
          body: 'Vous conservez la propriété de vos photos. Nous les utilisons uniquement pour extraire les informations demandées, puis nous les supprimons — voir notre Politique de confidentialité. Ne téléversez pas de photos que vous n’avez pas le droit d’utiliser, ni contenant du contenu illégal.',
        },
        {
          heading: 'Absence de garantie',
          body: 'Snapsist est fourni « en l’état ». Nous visons une lecture précise, mais il vous appartient de vérifier chaque résultat avant son enregistrement — l’écran de vérification existe précisément pour qu’une erreur de lecture ne soit jamais enregistrée sans que vous le sachiez.',
        },
        { heading: 'Modifications des présentes conditions', body: 'Nous pouvons mettre à jour ces Conditions à mesure que le produit évolue. Nous actualiserons la date ci-dessus à chaque modification.' },
        { heading: 'Contact', body: 'Des questions sur ces Conditions ? Écrivez à support@snapsist.app.' },
      ],
    },
    privacy: {
      title: 'Politique de confidentialité',
      updated: 'Dernière mise à jour : août 2026',
      sections: [
        {
          heading: 'Ce que nous collectons',
          body: 'Les photos que vous choisissez d’analyser (traitées une fois puis supprimées — voir ci-dessous), votre adresse e-mail si vous créez un compte, et des données d’usage basiques (fonctionnalités utilisées, journaux d’erreurs) pour faire fonctionner l’app.',
        },
        {
          heading: 'Ce que nous ne collectons pas',
          body: 'Nous n’accédons à vos Contacts, Calendrier, Rappels ou Photos que lorsque vous déclenchez explicitement un enregistrement — et même alors, uniquement l’élément concerné, jamais toute votre bibliothèque.',
        },
        {
          heading: 'Traitement des photos',
          body: 'Une photo que vous envoyez est transmise une seule fois à notre serveur, envoyée à Google Cloud Vision et à l’API Claude d’Anthropic pour en extraire les informations, puis supprimée. Nous ne conservons ni copie ni historique de vos photos sur nos serveurs. L’historique local de votre appareil est stocké uniquement sur celui-ci, pas chez nous — sauf avec Pro, où l’historique peut se synchroniser entre vos appareils, chiffré pendant le transfert.',
        },
        {
          heading: 'Tiers que nous utilisons',
          body: 'Google Cloud Vision (classification/OCR) et Anthropic (extraction de données structurées) traitent les photos pour notre compte, selon leurs propres conditions de traitement des données. Nous ne vendons jamais vos données à qui que ce soit.',
        },
        {
          heading: 'Vos droits',
          body: 'Supprimez votre compte et toutes les données associées à tout moment depuis Réglages — c’est immédiat et définitif. Vous pouvez aussi nous demander par e-mail une copie de ce que nous détenons sur vous.',
        },
        {
          heading: 'Confidentialité des mineurs',
          body: 'Snapsist ne s’adresse pas aux enfants de moins de 13 ans (ou l’âge minimum équivalent selon votre pays), et nous ne collectons pas sciemment leurs informations personnelles. Si vous pensez qu’un mineur a créé un compte, contactez-nous et nous le supprimerons.',
        },
        {
          heading: 'Sécurité',
          body: 'Nous utilisons des mesures standard du secteur — connexions chiffrées, mots de passe hachés — pour protéger vos données, mais aucun système n’est sûr à 100 %. Utilisez un mot de passe fort et unique.',
        },
        { heading: 'Modifications de cette politique', body: 'Nous actualiserons la date ci-dessus en cas de changement important de cette politique.' },
        { heading: 'Contact', body: 'privacy@snapsist.app' },
      ],
    },
    refund: {
      title: 'Politique de remboursement',
      updated: 'Dernière mise à jour : août 2026',
      sections: [
        {
          heading: 'Bêta actuelle',
          body: 'Snapsist est gratuit pour tout le monde en ce moment — les fonctionnalités Pro sont débloquées gratuitement pendant la bêta, aucun paiement n’est donc encore collecté. Cette politique décrit ce qui s’appliquera une fois la facturation activée.',
        },
        { heading: 'Annulation', body: 'Annulez votre forfait Pro à tout moment depuis Réglages. Cela prend effet immédiatement — vous repassez au forfait Free et ne serez plus facturé.' },
        {
          heading: 'Remboursements',
          body: 'Nous ne remboursons pas la partie non utilisée d’une période déjà payée. Si vous avez été facturé par erreur — facturé après annulation, facturé deux fois — contactez-nous et nous vous rembourserons.',
        },
        {
          heading: "Achats via l'App Store",
          body: 'Si vous vous êtes abonné via l’App Store d’Apple, les remboursements pour ce moyen de paiement sont gérés par Apple, pas par nous — faites votre demande sur reportaproblem.apple.com.',
        },
        { heading: 'Comment faire une demande', body: 'Écrivez à support@snapsist.app avec l’e-mail de votre compte et le montant concerné. Nous visons une réponse sous 5 jours ouvrés.' },
      ],
    },
    childSafety: {
      title: 'Normes de sécurité des enfants',
      updated: 'Dernière mise à jour : août 2026',
      sections: [
        {
          heading: 'Aucun contenu entre utilisateurs',
          body: 'Snapsist n’a aucune fonctionnalité sociale, de messagerie, ni de partage de contenu entre utilisateurs. Chaque photo que vous analysez reste privée à votre compte et n’est jamais visible par personne d’autre.',
        },
        {
          heading: 'Tolérance zéro',
          body: 'Nous appliquons une tolérance zéro envers les contenus d’abus sexuel sur mineurs (CSAM) ou tout contenu mettant en danger des enfants. Snapsist n’est ni conçu ni destiné à être utilisé par des enfants, et la création d’un compte nécessite une adresse e-mail.',
        },
        {
          heading: 'Signalement',
          body: 'Si vous avez connaissance d’un usage abusif de Snapsist impliquant la sécurité d’un enfant, contactez-nous immédiatement à safety@snapsist.app. Nous examinons chaque signalement et coopérons avec les forces de l’ordre et des organisations comme le NCMEC lorsque la loi l’exige.',
        },
        {
          heading: 'Modération',
          body: 'Les photos sont traitées une fois puis supprimées, sans être stockées sur nos serveurs (voir notre Politique de confidentialité) — il n’y a donc pas de contenu persistant à héberger après traitement. Nous prenons néanmoins chaque signalement au sérieux et suspendrons ou supprimerons tout compte reconnu en infraction avec cette politique.',
        },
        { heading: 'Âge requis', body: 'Snapsist ne s’adresse pas aux enfants de moins de 13 ans. Consultez notre Politique de confidentialité pour plus de détails sur les données des mineurs.' },
        { heading: 'Contact', body: 'safety@snapsist.app' },
      ],
    },
  },
  de: {
    nav: { terms: 'Nutzungsbedingungen', privacy: 'Datenschutzerklärung', refund: 'Rückerstattungsrichtlinie', childSafety: 'Kinderschutz' },
    terms: {
      title: 'Nutzungsbedingungen',
      updated: 'Zuletzt aktualisiert: August 2026',
      sections: [
        {
          heading: 'Zustimmung zu den Bedingungen',
          body: 'Durch die Nutzung von Snapsist („die App") stimmst du diesen Nutzungsbedingungen zu. Wenn du nicht einverstanden bist, nutze die App bitte nicht.',
        },
        {
          heading: 'Was Snapsist macht',
          body: 'Snapsist liest ein von dir bereitgestelltes Foto und hilft dir, die enthaltenen Informationen in bereits auf deinem Gerät vorhandene Apps zu speichern — Kontakte, Kalender, Erinnerungen, Apple Wallet — oder übergibt sie über das Teilen-Menü an Notizen. Du prüfst und bestätigst jeden Speichervorgang, bevor etwas geschrieben wird.',
        },
        {
          heading: 'Konten',
          body: 'Ein Konto ist optional und wird nur für den Pro-Plan benötigt. Du bist selbst dafür verantwortlich, deine Anmeldedaten sicher aufzubewahren. Du kannst dein Konto und alle zugehörigen Daten jederzeit in den Einstellungen der App löschen — die Löschung erfolgt sofort und endgültig.',
        },
        {
          heading: 'Abonnements (Pro-Plan)',
          body: 'Pro ist ein wiederkehrendes monatliches Abonnement, das sich automatisch zum bei der Anmeldung angezeigten Preis verlängert, bis du kündigst. Kündige jederzeit in den Einstellungen — die Kündigung wird sofort wirksam, du wirst nicht erneut belastet und behältst die bereits bezahlte Zeit. Während der aktuellen Beta stehen die Pro-Funktionen allen kostenlos zur Verfügung.',
        },
        {
          heading: 'Angemessene Nutzung',
          body: 'Pro hebt das monatliche Limit von 10 Fotos des Free-Plans für die normale individuelle Nutzung auf. Es ist nicht für automatisierte, skriptgesteuerte oder massenhafte Verarbeitung im Auftrag anderer gedacht. Bei ungewöhnlicher Nutzung kontaktieren wir dich, bevor wir etwas einschränken — wir drosseln echte Nutzer nie ohne Vorwarnung.',
        },
        {
          heading: 'Deine Inhalte',
          body: 'Du behältst das Eigentum an deinen Fotos. Wir verwenden sie nur, um die gewünschten Informationen zu extrahieren, und löschen sie danach — siehe unsere Datenschutzerklärung. Lade keine Fotos hoch, an denen du keine Nutzungsrechte hast oder die illegale Inhalte enthalten.',
        },
        {
          heading: 'Kein Gewährleistungsausschluss',
          body: 'Snapsist wird „wie besehen" bereitgestellt. Wir bemühen uns um genaue Ergebnisse, aber du bist dafür verantwortlich, jedes Ergebnis vor dem Speichern zu prüfen — der Prüfbildschirm existiert genau deshalb, damit ein Lesefehler nie unbemerkt gespeichert wird.',
        },
        { heading: 'Änderungen dieser Bedingungen', body: 'Wir können diese Bedingungen im Zuge der Weiterentwicklung des Produkts aktualisieren. Bei jeder Änderung aktualisieren wir das Datum oben.' },
        { heading: 'Kontakt', body: 'Fragen zu diesen Bedingungen? Schreib an support@snapsist.app.' },
      ],
    },
    privacy: {
      title: 'Datenschutzerklärung',
      updated: 'Zuletzt aktualisiert: August 2026',
      sections: [
        {
          heading: 'Was wir erfassen',
          body: 'Fotos, die du zur Analyse auswählst (einmal verarbeitet und danach gelöscht — siehe unten), deine E-Mail-Adresse, falls du ein Konto erstellst, sowie grundlegende Nutzungsdaten (welche Funktionen du nutzt, Fehlerprotokolle), um die App am Laufen zu halten.',
        },
        {
          heading: 'Was wir nicht erfassen',
          body: 'Wir greifen nicht auf deine Kontakte, deinen Kalender, deine Erinnerungen oder Fotos zu, außer wenn du ausdrücklich einen Speichervorgang auslöst — und selbst dann nur auf das konkrete betroffene Element, nie auf deine gesamte Mediathek.',
        },
        {
          heading: 'Umgang mit Fotos',
          body: 'Ein von dir übermitteltes Foto wird einmal an unseren Server gesendet, zur Informationsextraktion an Google Cloud Vision und die Claude-API von Anthropic weitergegeben und anschließend gelöscht. Wir bewahren weder eine Kopie noch einen Verlauf deiner Fotos auf unseren Servern auf. Der lokale Verlauf auf deinem Gerät wird nur auf diesem gespeichert, nicht bei uns — außer bei Pro, wo der Verlauf verschlüsselt während der Übertragung geräteübergreifend synchronisiert werden kann.',
        },
        {
          heading: 'Von uns genutzte Drittanbieter',
          body: 'Google Cloud Vision (Klassifizierung/OCR) und Anthropic (Extraktion strukturierter Daten) verarbeiten Fotos in unserem Auftrag gemäß ihren eigenen Datenverarbeitungsbedingungen. Wir verkaufen deine Daten niemals an Dritte.',
        },
        {
          heading: 'Deine Rechte',
          body: 'Lösche dein Konto und alle zugehörigen Daten jederzeit in den Einstellungen — das geschieht sofort und endgültig. Du kannst uns per E-Mail auch um eine Kopie der über dich gespeicherten Daten bitten.',
        },
        {
          heading: 'Datenschutz für Kinder',
          body: 'Snapsist richtet sich nicht an Kinder unter 13 Jahren (oder dem entsprechenden Mindestalter in deinem Land), und wir erfassen wissentlich keine personenbezogenen Daten von ihnen. Falls du vermutest, dass ein Kind ein Konto erstellt hat, kontaktiere uns — wir löschen es.',
        },
        {
          heading: 'Sicherheit',
          body: 'Wir verwenden branchenübliche Maßnahmen — verschlüsselte Verbindungen, gehashte Passwörter —, um deine Daten zu schützen, aber kein System ist zu 100 % sicher. Verwende bitte ein starkes, einzigartiges Passwort.',
        },
        { heading: 'Änderungen dieser Erklärung', body: 'Wir aktualisieren das Datum oben, wenn sich diese Erklärung wesentlich ändert.' },
        { heading: 'Kontakt', body: 'privacy@snapsist.app' },
      ],
    },
    refund: {
      title: 'Rückerstattungsrichtlinie',
      updated: 'Zuletzt aktualisiert: August 2026',
      sections: [
        {
          heading: 'Aktuelle Beta',
          body: 'Snapsist ist derzeit für alle kostenlos — die Pro-Funktionen sind während der Beta kostenlos freigeschaltet, es werden also noch keine Zahlungen eingezogen. Diese Richtlinie beschreibt, was gilt, sobald die Abrechnung startet.',
        },
        { heading: 'Kündigung', body: 'Kündige deinen Pro-Plan jederzeit in den Einstellungen. Das wird sofort wirksam — du wechselst zum Free-Plan und wirst nicht erneut belastet.' },
        {
          heading: 'Rückerstattungen',
          body: 'Wir erstatten nicht den ungenutzten Teil eines bereits bezahlten Zeitraums. Wurdest du versehentlich belastet — etwa nach der Kündigung oder doppelt —, kontaktiere uns und wir erstatten es dir.',
        },
        {
          heading: 'Käufe über den App Store',
          body: 'Falls du über Apples App Store abonniert hast, werden Rückerstattungen für diese Zahlungsmethode von Apple abgewickelt, nicht von uns — beantrage sie unter reportaproblem.apple.com.',
        },
        { heading: 'So beantragst du eine Rückerstattung', body: 'Schreib an support@snapsist.app mit deiner Konto-E-Mail und der betreffenden Abbuchung. Wir sind bestrebt, innerhalb von 5 Werktagen zu antworten.' },
      ],
    },
    childSafety: {
      title: 'Kinderschutzstandards',
      updated: 'Zuletzt aktualisiert: August 2026',
      sections: [
        {
          heading: 'Keine Inhalte zwischen Nutzern',
          body: 'Snapsist hat keine sozialen Funktionen, keine Nachrichtenfunktion und keinen Inhalteaustausch zwischen Nutzern. Jedes analysierte Foto bleibt privat in deinem Konto und ist für niemand anderen sichtbar.',
        },
        {
          heading: 'Null-Toleranz-Prinzip',
          body: 'Wir haben null Toleranz gegenüber Material zu sexuellem Kindesmissbrauch (CSAM) oder jeglichen Inhalten, die Kinder gefährden. Snapsist ist weder für die Nutzung durch Kinder konzipiert noch dafür vorgesehen, und die Kontoerstellung erfordert eine E-Mail-Adresse.',
        },
        {
          heading: 'Meldung',
          body: 'Wenn dir ein Missbrauch von Snapsist bekannt wird, der die Sicherheit eines Kindes betrifft, kontaktiere uns sofort unter safety@snapsist.app. Wir prüfen jede Meldung und arbeiten dort, wo es gesetzlich erforderlich ist, mit Strafverfolgungsbehörden und Organisationen wie dem NCMEC zusammen.',
        },
        {
          heading: 'Moderation',
          body: 'Fotos werden einmal verarbeitet und dann gelöscht, nicht auf unseren Servern gespeichert (siehe Datenschutzerklärung) — es gibt also keine dauerhaften Inhalte, die wir nach der Verarbeitung vorhalten könnten. Dennoch nehmen wir jede Meldung ernst und sperren oder löschen jedes Konto, das gegen diese Richtlinie verstößt.',
        },
        { heading: 'Altersanforderung', body: 'Snapsist richtet sich nicht an Kinder unter 13 Jahren. Details zu Kinderdaten findest du in unserer Datenschutzerklärung.' },
        { heading: 'Kontakt', body: 'safety@snapsist.app' },
      ],
    },
  },
};
