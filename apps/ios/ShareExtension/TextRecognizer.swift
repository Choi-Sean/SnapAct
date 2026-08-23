//
//  TextRecognizer.swift
//  ShareExtension
//
//  LAYER 0 — on-device OCR, Swift/Apple Vision port.
//  Unlike apps/expo/src/layer0/textRecognition.ts (which uses Google ML
//  Kit's iOS SDK — a session tradeoff to avoid hand-writing/blind-shipping
//  Swift), this extension is native Swift already, so there's no reason not
//  to use Apple's own Vision framework directly: one fewer dependency, and
//  it's what was actually asked for originally.
//
//  Language coverage: VNRecognizeTextRequestRevision3 (iOS 16+) supports
//  en/es/fr/de/zh/ko/ja — every locale this app ships — so there's no
//  per-language capability gate to track here (see the research this
//  session landed on, also documented in backend/app/pricing.py).
//
import Vision
import UIKit

enum TextRecognitionError: Error {
    case noCGImage
    case recognitionFailed(Error)
}

func recognizeText(in image: UIImage) async throws -> String {
    guard let cgImage = image.cgImage else {
        throw TextRecognitionError.noCGImage
    }

    return try await withCheckedThrowingContinuation { continuation in
        let request = VNRecognizeTextRequest { request, error in
            if let error = error {
                continuation.resume(throwing: TextRecognitionError.recognitionFailed(error))
                return
            }
            let observations = request.results as? [VNRecognizedTextObservation] ?? []
            let text = observations
                .compactMap { $0.topCandidates(1).first?.string }
                .joined(separator: "\n")
            continuation.resume(returning: text)
        }

        request.recognitionLevel = .accurate
        request.usesLanguageCorrection = true
        request.recognitionLanguages = ["en-US", "ko-KR", "ja-JP", "zh-Hans", "es-ES", "fr-FR", "de-DE"]

        let handler = VNImageRequestHandler(cgImage: cgImage, orientation: cgOrientation(from: image.imageOrientation))
        do {
            try handler.perform([request])
        } catch {
            continuation.resume(throwing: TextRecognitionError.recognitionFailed(error))
        }
    }
}

private func cgOrientation(from uiOrientation: UIImage.Orientation) -> CGImagePropertyOrientation {
    switch uiOrientation {
    case .up: return .up
    case .upMirrored: return .upMirrored
    case .down: return .down
    case .downMirrored: return .downMirrored
    case .left: return .left
    case .leftMirrored: return .leftMirrored
    case .right: return .right
    case .rightMirrored: return .rightMirrored
    @unknown default: return .up
    }
}
