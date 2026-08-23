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
        ocrFailed: "Couldn't read this photo."
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
        ocrFailed: "사진을 읽지 못했어요."
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
        ocrFailed: "写真を読み取れませんでした。"
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
        ocrFailed: "无法读取这张照片。"
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
        ocrFailed: "No se pudo leer esta foto."
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
        ocrFailed: "Impossible de lire cette photo."
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
        ocrFailed: "Dieses Foto konnte nicht gelesen werden."
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
