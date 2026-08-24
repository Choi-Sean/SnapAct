//
//  L10n.swift
//  ShareExtension
//
//  Minimal localization for the extension's own UI strings — kept in sync
//  manually with apps/expo/src/i18n/dictionaries.ts's `home` keys for the
//  3 supported locales (en/ko/es), since this target can't import the RN
//  dictionary. If you add a string here, add its counterpart there too
//  (and vice versa) so the two pipelines never drift into different wording.
//
import Foundation

struct L10nStrings {
    let analyzing: String
    let authRequiredTitle: String
    let authRequiredBody: String
    let sensitiveCardBlockedTitle: String
    let sensitiveCardBlockedBody: String
    let categoryLabel: String
    let saveToReminders: String
    let savedTitle: String
    let saveFailed: String
    let needsAppTitle: String
    let needsAppBody: String
    let openAppButton: String
    let closeButton: String
    let ocrFailed: String
    let layer1Loading: String
    let lockedTitle: String
    let lockedBody: String
    let layer1FailedTitle: String
    let finishInAppButton: String
    let contactName: String
    let contactPhone: String
    let contactCompany: String
    let calendarTitle: String
    let calendarLocation: String
    let calendarStart: String
}

private let table: [String: L10nStrings] = [
    "en": L10nStrings(
        analyzing: "Reading photo…",
        authRequiredTitle: "Sign in to analyze photos",
        authRequiredBody: "Real photo analysis needs a Snapsist account. Open the app to sign up or log in, then share again.",
        sensitiveCardBlockedTitle: "This looks like a payment card",
        sensitiveCardBlockedBody: "We don't store or analyze sensitive card details — this photo was not sent anywhere or saved.",
        categoryLabel: "Category",
        saveToReminders: "Save to Reminders",
        savedTitle: "Saved",
        saveFailed: "Couldn't save",
        needsAppTitle: "Open Snapsist to finish",
        needsAppBody: "This category needs the full app to analyze — on-device analysis only handles medication, documents, and unrecognized photos.",
        openAppButton: "Open Snapsist",
        closeButton: "Close",
        ocrFailed: "Couldn't read this photo.",
        layer1Loading: "Sending to server…",
        lockedTitle: "Needs tokens",
        lockedBody: "This category needs an account with tokens. Open the app to sign in or buy tokens.",
        layer1FailedTitle: "Couldn't reach the server",
        finishInAppButton: "Finish in Snapsist",
        contactName: "Name",
        contactPhone: "Phone",
        contactCompany: "Company",
        calendarTitle: "Title",
        calendarLocation: "Location",
        calendarStart: "Starts"
    ),
    "ko": L10nStrings(
        analyzing: "사진을 읽는 중…",
        authRequiredTitle: "사진 분석은 로그인 후 이용할 수 있어요",
        authRequiredBody: "실제 사진 분석은 Snapsist 계정이 필요해요. 앱을 열어서 가입하거나 로그인한 뒤 다시 공유해주세요.",
        sensitiveCardBlockedTitle: "결제 카드로 보이는 사진이에요",
        sensitiveCardBlockedBody: "저희는 카드 정보 같은 민감한 정보는 저장하거나 분석하지 않아요 — 이 사진은 어디로도 전송되거나 저장되지 않았습니다.",
        categoryLabel: "카테고리",
        saveToReminders: "미리 알림에 저장",
        savedTitle: "저장 완료",
        saveFailed: "저장 실패",
        needsAppTitle: "Snapsist 앱에서 마저 진행해주세요",
        needsAppBody: "이 카테고리는 앱에서 분석해야 해요 — 온디바이스 분석은 복약·문서·미인식 사진만 처리해요.",
        openAppButton: "Snapsist 열기",
        closeButton: "닫기",
        ocrFailed: "사진을 읽지 못했어요.",
        layer1Loading: "서버로 보내는 중…",
        lockedTitle: "토큰이 필요해요",
        lockedBody: "이 카테고리는 토큰이 있는 계정이 필요해요. 앱을 열어서 로그인하거나 토큰을 구매해주세요.",
        layer1FailedTitle: "서버에 연결하지 못했어요",
        finishInAppButton: "Snapsist에서 마저 진행",
        contactName: "이름",
        contactPhone: "전화번호",
        contactCompany: "회사",
        calendarTitle: "제목",
        calendarLocation: "장소",
        calendarStart: "시작"
    ),
    "es": L10nStrings(
        analyzing: "Leyendo la foto…",
        authRequiredTitle: "Inicia sesión para analizar fotos",
        authRequiredBody: "El análisis real de fotos necesita una cuenta de Snapsist. Abre la app para registrarte o iniciar sesión, y vuelve a compartir.",
        sensitiveCardBlockedTitle: "Esto parece una tarjeta de pago",
        sensitiveCardBlockedBody: "No almacenamos ni analizamos datos sensibles de tarjetas — esta foto no se envió ni se guardó en ningún lugar.",
        categoryLabel: "Categoría",
        saveToReminders: "Guardar en Recordatorios",
        savedTitle: "Guardado",
        saveFailed: "No se pudo guardar",
        needsAppTitle: "Abre Snapsist para continuar",
        needsAppBody: "Esta categoría necesita la app completa para analizarse — el análisis en el dispositivo solo procesa medicamentos, documentos y fotos no reconocidas.",
        openAppButton: "Abrir Snapsist",
        closeButton: "Cerrar",
        ocrFailed: "No se pudo leer esta foto.",
        layer1Loading: "Enviando al servidor…",
        lockedTitle: "Necesita tokens",
        lockedBody: "Esta categoría necesita una cuenta con tokens. Abre la app para iniciar sesión o comprar tokens.",
        layer1FailedTitle: "No se pudo conectar con el servidor",
        finishInAppButton: "Terminar en Snapsist",
        contactName: "Nombre",
        contactPhone: "Teléfono",
        contactCompany: "Empresa",
        calendarTitle: "Título",
        calendarLocation: "Ubicación",
        calendarStart: "Inicio"
    ),
]

var L10n: L10nStrings {
    let lang = String(Locale.current.language.languageCode?.identifier ?? "en")
    return table[lang] ?? table["en"]!
}

// Mirrors apps/expo/src/i18n/dictionaries.ts's batch.categoryLabels.
private let categoryNames: [String: [Category: String]] = [
    "en": [.medication: "Medication", .document: "Document", .other: "Unrecognized"],
    "ko": [.medication: "복약", .document: "문서", .other: "미인식"],
    "es": [.medication: "Medicamento", .document: "Documento", .other: "No reconocido"],
]

func categoryName(_ category: Category) -> String {
    let lang = String(Locale.current.language.languageCode?.identifier ?? "en")
    let localized = categoryNames[lang] ?? categoryNames["en"]!
    return localized[category] ?? category.rawValue
}
