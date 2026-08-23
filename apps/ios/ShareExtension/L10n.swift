//
//  L10n.swift
//  ShareExtension
//
//  Minimal localization for the extension's own UI strings — kept in sync
//  manually with apps/expo/src/i18n/dictionaries.ts's `home` keys for the
//  7 supported locales, since this target can't import the RN dictionary.
//  If you add a string here, add its counterpart there too (and vice
//  versa) so the two pipelines never drift into different wording.
//
import Foundation

struct L10nStrings {
    let analyzing: String
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
    "ja": L10nStrings(
        analyzing: "写真を読み取り中…",
        categoryLabel: "カテゴリー",
        saveToReminders: "リマインダーに保存",
        savedTitle: "保存しました",
        saveFailed: "保存できませんでした",
        needsAppTitle: "Snapsistアプリで続けてください",
        needsAppBody: "このカテゴリーはアプリでの分析が必要です — オンデバイス分析は服薬・書類・未認識の写真のみ対応しています。",
        openAppButton: "Snapsistを開く",
        closeButton: "閉じる",
        ocrFailed: "写真を読み取れませんでした。",
        layer1Loading: "サーバーに送信中…",
        lockedTitle: "トークンが必要です",
        lockedBody: "このカテゴリーにはトークンのあるアカウントが必要です。アプリを開いてログインするかトークンを購入してください。",
        layer1FailedTitle: "サーバーに接続できませんでした",
        finishInAppButton: "Snapsistで続きを行う",
        contactName: "名前",
        contactPhone: "電話番号",
        contactCompany: "会社",
        calendarTitle: "タイトル",
        calendarLocation: "場所",
        calendarStart: "開始"
    ),
    "zh": L10nStrings(
        analyzing: "正在读取照片…",
        categoryLabel: "类别",
        saveToReminders: "保存到提醒事项",
        savedTitle: "已保存",
        saveFailed: "保存失败",
        needsAppTitle: "请在 Snapsist 应用中继续",
        needsAppBody: "此类别需要在应用中分析 — 设备端分析仅处理服药、文档和未识别的照片。",
        openAppButton: "打开 Snapsist",
        closeButton: "关闭",
        ocrFailed: "无法读取这张照片。",
        layer1Loading: "正在发送到服务器…",
        lockedTitle: "需要代币",
        lockedBody: "此类别需要有代币的账号。请打开应用登录或购买代币。",
        layer1FailedTitle: "无法连接服务器",
        finishInAppButton: "在 Snapsist 中继续",
        contactName: "姓名",
        contactPhone: "电话",
        contactCompany: "公司",
        calendarTitle: "标题",
        calendarLocation: "地点",
        calendarStart: "开始时间"
    ),
    "es": L10nStrings(
        analyzing: "Leyendo la foto…",
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
    "fr": L10nStrings(
        analyzing: "Lecture de la photo…",
        categoryLabel: "Catégorie",
        saveToReminders: "Enregistrer dans Rappels",
        savedTitle: "Enregistré",
        saveFailed: "Échec de l'enregistrement",
        needsAppTitle: "Ouvrez Snapsist pour continuer",
        needsAppBody: "Cette catégorie nécessite l'application complète pour être analysée — l'analyse sur l'appareil ne traite que les médicaments, documents et photos non reconnues.",
        openAppButton: "Ouvrir Snapsist",
        closeButton: "Fermer",
        ocrFailed: "Impossible de lire cette photo.",
        layer1Loading: "Envoi au serveur…",
        lockedTitle: "Jetons nécessaires",
        lockedBody: "Cette catégorie nécessite un compte avec des jetons. Ouvrez l'app pour vous connecter ou acheter des jetons.",
        layer1FailedTitle: "Impossible de contacter le serveur",
        finishInAppButton: "Terminer dans Snapsist",
        contactName: "Nom",
        contactPhone: "Téléphone",
        contactCompany: "Société",
        calendarTitle: "Titre",
        calendarLocation: "Lieu",
        calendarStart: "Début"
    ),
    "de": L10nStrings(
        analyzing: "Foto wird gelesen…",
        categoryLabel: "Kategorie",
        saveToReminders: "In Erinnerungen speichern",
        savedTitle: "Gespeichert",
        saveFailed: "Speichern fehlgeschlagen",
        needsAppTitle: "Öffne Snapsist, um fortzufahren",
        needsAppBody: "Diese Kategorie muss in der App analysiert werden — die Analyse auf dem Gerät verarbeitet nur Medikamente, Dokumente und nicht erkannte Fotos.",
        openAppButton: "Snapsist öffnen",
        closeButton: "Schließen",
        ocrFailed: "Dieses Foto konnte nicht gelesen werden.",
        layer1Loading: "Wird an den Server gesendet…",
        lockedTitle: "Token erforderlich",
        lockedBody: "Diese Kategorie benötigt ein Konto mit Token. Öffne die App, um dich anzumelden oder Token zu kaufen.",
        layer1FailedTitle: "Server nicht erreichbar",
        finishInAppButton: "In Snapsist fertigstellen",
        contactName: "Name",
        contactPhone: "Telefon",
        contactCompany: "Firma",
        calendarTitle: "Titel",
        calendarLocation: "Ort",
        calendarStart: "Beginn"
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
    "ja": [.medication: "服薬", .document: "書類", .other: "未認識"],
    "zh": [.medication: "服药", .document: "文档", .other: "未识别"],
    "es": [.medication: "Medicamento", .document: "Documento", .other: "No reconocido"],
    "fr": [.medication: "Médicament", .document: "Document", .other: "Non reconnu"],
    "de": [.medication: "Medikament", .document: "Dokument", .other: "Nicht erkannt"],
]

func categoryName(_ category: Category) -> String {
    let lang = String(Locale.current.language.languageCode?.identifier ?? "en")
    let localized = categoryNames[lang] ?? categoryNames["en"]!
    return localized[category] ?? category.rawValue
}
