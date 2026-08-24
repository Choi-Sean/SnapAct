//
//  LayerZeroAnalyzer.swift
//  ShareExtension
//
//  LAYER 0 — orchestrator, Swift port of
//  apps/expo/src/layer0/analyzeOnDevice.ts. Entry point for resolving a
//  shared photo entirely on-device: OCR (TextRecognizer.swift) + keyword
//  classification (ImageClassifier.swift), and for medication, best-effort
//  field extraction (MedicationExtractor.swift).
//
import UIKit

struct AnalysisResult {
    let category: Category
    let confidence: Double
    var medication: MedicationPayload?
    var rawText: String
}

enum Layer0Outcome {
    // Fully resolved on-device — nothing needs to leave the phone.
    case resolved(AnalysisResult)
    // Real category, but Layer 0 doesn't extract structured fields for it
    // (business_card/receipt/event_flyer always need Layer 1's Claude call
    // — see backend/app/pricing.py's LAYER0_CATEGORIES). Not a capability
    // failure, just normal routing.
    case needsLayer1(category: Category)
    // A payment-card photo, caught by SensitiveCardDetector.swift's
    // text-pattern check — never sent to Layer 1, regardless of what
    // category classifyText would have guessed.
    case blocked
    // The OCR call itself failed.
    case failed(Error)
}

func analyzeOnDevice(_ image: UIImage, metadata: PhotoMetadata? = nil) async -> Layer0Outcome {
    let rawText: String
    do {
        rawText = try await recognizeText(in: image)
    } catch {
        return .failed(error)
    }

    if looksLikePaymentCard(rawText) {
        return .blocked
    }

    let classification = classifyText(rawText)
    let confidence = applyMetadataNudge(category: classification.category, confidence: classification.confidence, metadata: metadata)
    guard layer0Categories.contains(classification.category) else {
        return .needsLayer1(category: classification.category)
    }
    // "other" with no keyword matches at all (confidence stuck at
    // ImageClassifier.swift's 0.3 floor) isn't confidently "nothing
    // recognizable" — it's just as likely a real business_card/receipt/
    // event_flyer in a language the (mostly English) keyword lists don't
    // cover. Let Layer 1's language-agnostic classifier take a real look
    // rather than silently misfiling it. Real matches always score >= 0.65.
    if classification.category == .other && classification.confidence < 0.5 {
        return .needsLayer1(category: .other)
    }

    var result = AnalysisResult(
        category: classification.category,
        confidence: confidence,
        medication: nil,
        rawText: rawText
    )
    if classification.category == .medication {
        result.medication = extractMedication(rawText)
    }
    return .resolved(result)
}
