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
          body: 'An account is optional — the core features work without one. Creating a free account gets you synced history in the web dashboard; the Pro plan additionally requires one. You’re responsible for keeping your login credentials secure. You can delete your account and all associated data at any time from Settings in the app — deletion is immediate and permanent.',
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
          body: 'You keep ownership of your photos. We use them only to extract the information you asked for, then discard them immediately — we never store a copy on our servers. See our Privacy Policy for details. Don’t upload photos you don’t have the right to use, or that contain illegal content.',
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
          body: 'Photos you choose to analyze (processed in memory only, never stored — see below), your email address if you create an account, and basic usage data (which features you use, error logs) to keep the app working.',
        },
        {
          heading: 'What we don’t collect',
          body: 'We don’t access your Contacts, Calendar, Reminders, or Photos except when you explicitly trigger a save — and even then, only the specific item involved, never your whole library.',
        },
        {
          heading: 'How photos are handled',
          body: 'A photo you submit is sent to our backend and passed to Google Cloud Vision and Anthropic’s Claude API to extract information, then immediately discarded — we never store a copy of your photo, on our servers or anywhere else. Your device keeps its own copy in the app’s local history, entirely under your control. If you’re signed in, the extracted result (category, summary, what it was saved to) syncs to your account so you can see your history from the web dashboard — but never the photo itself.',
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
          body: 'Photos are processed in memory only and never stored on our servers (see our Privacy Policy) — so there’s no persistent image content for us to host or review after processing. We still take every report seriously and will suspend or delete any account found to violate this policy.',
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
          body: '계정은 선택 사항이며, 핵심 기능은 계정 없이도 사용할 수 있습니다. 무료 계정을 만들면 웹 대시보드에서 히스토리가 동기화되고, Pro 플랜을 이용하려면 계정이 필요합니다. 로그인 정보를 안전하게 보관할 책임은 사용자에게 있습니다. 앱의 설정에서 언제든지 계정과 관련 데이터를 삭제할 수 있으며, 삭제는 즉시 영구적으로 처리됩니다.',
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
          body: '사진의 소유권은 사용자에게 있습니다. 저희는 요청하신 정보를 추출하는 용도로만 사진을 사용한 뒤 즉시 폐기합니다 — 서버에 사본을 저장하지 않습니다 (자세한 내용은 개인정보처리방침 참고). 사용 권한이 없는 사진이나 불법적인 내용이 담긴 사진은 업로드하지 마세요.',
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
          body: '분석을 위해 선택한 사진(메모리에서만 처리되고 저장되지 않음 — 아래 참고), 계정을 만든 경우 이메일 주소, 그리고 앱이 정상적으로 동작하도록 돕는 기본적인 사용 데이터(어떤 기능을 사용했는지, 오류 로그)를 수집합니다.',
        },
        {
          heading: '수집하지 않는 정보',
          body: '사용자가 직접 저장을 실행하지 않는 한 연락처, 캘린더, 미리 알림, 사진에 접근하지 않으며, 저장을 실행할 때도 해당 항목 하나만 접근하고 전체 라이브러리에는 접근하지 않습니다.',
        },
        {
          heading: '사진 처리 방식',
          body: '제출한 사진은 저희 서버로 전송되어 Google Cloud Vision과 Anthropic의 Claude API로 정보 추출을 위해 전달된 뒤 즉시 폐기됩니다 — 서버든 어디든 사진 사본을 저장하지 않습니다. 사진은 기기 안 앱의 히스토리에만 보관되며, 전적으로 사용자가 관리합니다. 로그인한 상태라면 분석 결과(카테고리, 요약, 저장 위치)가 계정에 동기화되어 웹 대시보드에서 히스토리를 확인할 수 있지만, 사진 자체는 절대 동기화되지 않습니다.',
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
          body: '사진은 메모리에서만 처리되며 저희 서버에 저장되지 않습니다(개인정보처리방침 참고) — 그래서 처리 이후 저희가 계속 보관하며 검토할 이미지 콘텐츠 자체가 없습니다. 그럼에도 모든 신고를 진지하게 받아들이며, 이 정책을 위반한 것으로 확인된 계정은 정지하거나 삭제합니다.',
        },
        { heading: '연령 제한', body: 'Snapsist는 만 13세 미만 아동을 대상으로 하지 않습니다. 아동 데이터에 대한 자세한 내용은 개인정보처리방침을 참고해주세요.' },
        { heading: '문의', body: 'safety@snapsist.app' },
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
          body: 'Crear una cuenta es opcional — las funciones principales funcionan sin ella. Crear una cuenta gratuita te da un historial sincronizado en el panel web; el plan Pro sí requiere una cuenta. Eres responsable de mantener seguras tus credenciales de acceso. Puedes eliminar tu cuenta y todos los datos asociados en cualquier momento desde Ajustes en la app — la eliminación es inmediata y permanente.',
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
          body: 'Conservas la propiedad de tus fotos. Las usamos solo para extraer la información que pediste y luego las eliminamos de inmediato — nunca guardamos una copia en nuestros servidores. Consulta nuestra Política de privacidad para más detalles. No subas fotos que no tengas derecho a usar, ni que contengan contenido ilegal.',
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
          body: 'Las fotos que eliges analizar (procesadas solo en memoria, nunca almacenadas — ver más abajo), tu correo electrónico si creas una cuenta, y datos básicos de uso (qué funciones usas, registros de errores) para mantener la app funcionando.',
        },
        {
          heading: 'Qué no recopilamos',
          body: 'No accedemos a tus Contactos, Calendario, Recordatorios ni Fotos salvo cuando activas explícitamente un guardado — e incluso entonces, solo el elemento concreto implicado, nunca toda tu biblioteca.',
        },
        {
          heading: 'Cómo se tratan las fotos',
          body: 'Una foto que envías se manda a nuestro servidor y se pasa a Google Cloud Vision y a la API Claude de Anthropic para extraer información, y luego se elimina de inmediato — nunca guardamos una copia de tu foto, ni en nuestros servidores ni en ningún otro sitio. Tu dispositivo conserva su propia copia en el historial local de la app, bajo tu control. Si has iniciado sesión, el resultado extraído (categoría, resumen, dónde se guardó) se sincroniza con tu cuenta para que puedas ver tu historial desde el panel web — pero nunca la foto en sí.',
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
          body: 'Las fotos se procesan solo en memoria y nunca se almacenan en nuestros servidores (ver Política de privacidad) — así que no hay contenido de imagen persistente que podamos alojar o revisar tras el procesamiento. Aun así, nos tomamos en serio cada denuncia y suspenderemos o eliminaremos cualquier cuenta que infrinja esta política.',
        },
        { heading: 'Requisito de edad', body: 'Snapsist no está dirigida a menores de 13 años. Consulta nuestra Política de privacidad para más detalles sobre los datos de menores.' },
        { heading: 'Contacto', body: 'safety@snapsist.app' },
      ],
    },
  },
};
