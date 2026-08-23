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
    .receipt: ["receipt", "total", "subtotal", "tax", "invoice", "cashier"],
    .businessCard: ["business card", "card", "logo"],
    .eventFlyer: ["flyer", "poster", "event", "ticket", "invitation"],
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
    .document: ["document", "text", "paper", "letter", "form"],
    .other: [],
]

struct ClassifyResult {
    let category: Category
    let confidence: Double
}

func classifyText(_ ocrText: String) -> ClassifyResult {
    let haystack = ocrText.lowercased()
    var best: Category = .other
    var bestScore = 0

    for (category, words) in keywords {
        let score = words.reduce(0) { haystack.contains($1) ? $0 + 1 : $0 }
        if score > bestScore {
            bestScore = score
            best = category
        }
    }

    let confidence = bestScore > 0 ? min(0.95, 0.5 + Double(bestScore) * 0.15) : 0.3
    return ClassifyResult(category: best, confidence: confidence)
}
