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

    let classification = classifyText(rawText)
    let confidence = applyMetadataNudge(category: classification.category, confidence: classification.confidence, metadata: metadata)
    guard layer0Categories.contains(classification.category) else {
        return .needsLayer1(category: classification.category)
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
