//
//  ImageClassifier.swift
//  ShareExtension
//
//  LAYER 0 — on-device classification, Swift port.
//  Exact keyword-scoring parity with apps/expo/src/layer0/classify.ts (and,
//  in turn, backend/app/vision.py's _KEYWORDS) — a photo must land in the
//  same category whether it's classified here, on-device in the RN app, or
//  server-side. If you change one, change all three.
//
import Foundation

enum Category: String {
    case businessCard = "business_card"
    case receipt
    case eventFlyer = "event_flyer"
    case document
    case medication
    case other
}

// Categories Layer 0 is expected to fully resolve on its own — mirrors
// backend/app/pricing.py's LAYER0_CATEGORIES / apps/expo/src/layer0/categories.ts.
let layer0Categories: Set<Category> = [.medication, .document, .other]

private let keywords: [Category: [String]] = [
    .receipt: [
        "receipt", "total", "subtotal", "tax", "invoice", "cashier",
        "영수증", "합계", "부가세", "카드승인",
        "レシート", "領収書", "合計", "小計",
        "收据", "小票", "发票", "合计", "收銀",
        "recibo", "factura", "total a pagar", "subtotal",
        "reçu", "facture", "total ttc",
        "quittung", "rechnung", "gesamtbetrag", "zwischensumme",
    ],
    .businessCard: [
        "business card", "card", "logo", "tel", "mobile", "fax",
        "명함", "전화", "휴대폰", "연락처", "대표", "디자이너", "팀장", "과장", "부장",
        "名刺", "携帯", "電話",
        "名片", "手机", "电话",
        "tarjeta de presentación", "tarjeta personal", "móvil", "teléfono",
        "carte de visite", "portable", "téléphone",
        "visitenkarte", "mobil", "telefon",
    ],
    .eventFlyer: [
        "flyer", "poster", "event", "ticket", "invitation",
        "초대장", "행사", "전단", "일시", "장소",
        "チラシ", "招待状", "イベント", "日時", "会場",
        "传单", "邀请函", "活动", "时间", "地点",
        "folleto", "invitación", "evento",
        "dépliant", "invitation", "événement",
        "einladung", "veranstaltung",
    ],
    .medication: [
        // English
        "medication", "prescription", "pharmacy", "dosage", "tablet", "capsule",
        "before meals", "after meals", "twice daily", "once daily", "times a day",
        // Korean
        "복용법", "복용방법", "복용", "1일", "식전", "식후", "식후30분", "정제", "캡슐", "처방", "약국", "조제",
        // Japanese
        "服用", "服用方法", "用法", "食前", "食後", "錠", "カプセル", "処方", "薬局", "1日",
        // Chinese (simplified + traditional)
        "饭前", "饭后", "餐前", "餐后", "片", "胶囊", "膠囊", "處方", "药房", "藥局", "每日", "每天",
        // Spanish
        "medicamento", "receta", "farmacia", "dosis", "comprimido", "cápsula",
        "antes de las comidas", "después de las comidas", "una vez al día", "veces al día",
        // French
        "médicament", "ordonnance", "pharmacie", "comprimé", "gélule",
        "avant les repas", "après les repas", "par jour", "fois par jour",
        // German
        "medikament", "rezept", "apotheke", "dosierung", "tablette", "kapsel",
        "vor den mahlzeiten", "nach den mahlzeiten", "täglich", "mal täglich",
    ],
    .document: [
        "document", "letter", "form",
        "문서", "서류", "양식",
        "書類", "文書", "用紙",
        "文档", "文件", "表格",
        "documento", "formulario",
        "formulaire",
        "dokument", "formular",
    ],
    .other: [],
]

// A phone number is one of the few signals a business card almost always has
// and a document/receipt/flyer usually doesn't print in this exact grouped
// form — see vision.py's matching comment for the full reasoning (this
// exists because a real, non-English business card with no literal "business
// card" text on it was falling through to "document" instead).
private let phoneNumberRegex = try! NSRegularExpression(pattern: "\\b\\d{2,4}[-.\\s]\\d{3,4}[-.\\s]\\d{4}\\b")
private let phoneNumberScore = 2

struct ClassifyResult {
    let category: Category
    let confidence: Double
}

func classifyText(_ ocrText: String) -> ClassifyResult {
    let haystack = ocrText.lowercased()
    var scores: [Category: Int] = [:]
    for (category, words) in keywords {
        scores[category] = words.reduce(0) { haystack.contains($1) ? $0 + 1 : $0 }
    }
    let range = NSRange(ocrText.startIndex..., in: ocrText)
    if phoneNumberRegex.firstMatch(in: ocrText, range: range) != nil {
        scores[.businessCard] = (scores[.businessCard] ?? 0) + phoneNumberScore
    }

    var best: Category = .other
    var bestScore = 0
    for (category, score) in scores {
        if score > bestScore {
            bestScore = score
            best = category
        }
    }

    let confidence = bestScore > 0 ? min(0.95, 0.5 + Double(bestScore) * 0.15) : 0.3
    return ClassifyResult(category: best, confidence: confidence)
}
