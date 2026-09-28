import CoreGraphics
import Foundation
import Vision

/// One recognised piece of text, with where it was and how sure Vision is.
///
/// Spans are NOT flattened into a single string. The box is what lets a later
/// step show the user the crop a value came from, and what field extraction
/// needs to tell a total from a subtotal. Joining them with newlines throws
/// away exactly the information the expensive step was paid for.
public struct TextSpan: Sendable, Equatable {
    public let text: String
    /// Normalised, Vision's coordinate space: origin bottom-left.
    public let boundingBox: CGRect
    public let confidence: Double
}

public struct TextReadResult: Sendable {
    public let spans: [TextSpan]
    public let plan: LanguagePlan?
    public let durationMs: Int
    public let skipped: SkipReason?

    /// Length only. The CONTENT of recognised text is never logged — it is
    /// somebody's address or prescription.
    public var totalCharacters: Int { spans.reduce(0) { $0 + $1.text.count } }
    public var didRun: Bool { skipped == nil }

    public enum SkipReason: Sendable, Equatable {
        /// The class does not need text, or is a negative/unknown.
        case classDoesNotNeedOCR(CategoryID)
        /// The cheap detector found nothing, so recognition was not attempted.
        case noTextDetected
        /// Nothing requested is recognisable on this device.
        case noSupportedLanguage(requested: [String])
    }
}

/// Runs Vision text recognition according to the spec.
///
/// Scope stops at spans. No field extraction — that is L3 and a later session.
public struct TextReader: Sendable {
    private let spec: OCRSpec

    public init(spec: OCRSpec) { self.spec = spec }

    /// - Warning: `VNImageRequestHandler.perform(_:)` is synchronous. Never
    ///   call this on the main queue (ios-platform.md).
    public func read(_ image: CGImage,
                     category: CategoryID,
                     isNegative: Bool = false,
                     isScreenshot: Bool = false,
                     preferredLanguages: [String] = Locale.preferredLanguages) throws -> TextReadResult {
        guard spec.needsOCR(category, isNegative: isNegative) else {
            return TextReadResult(spans: [], plan: nil, durationMs: 0,
                                  skipped: .classDoesNotNeedOCR(category))
        }

        let plan = Self.plan(spec: spec, isScreenshot: isScreenshot,
                            preferredLanguages: preferredLanguages)
        guard !plan.isEmpty else {
            return TextReadResult(spans: [], plan: plan, durationMs: 0,
                                  skipped: .noSupportedLanguage(requested: plan.dropped))
        }

        let started = Date()

        // The cheap detector first: recognition on a photo with no text costs
        // the full price and returns nothing.
        guard try Self.containsText(image) else {
            return TextReadResult(spans: [], plan: plan,
                                  durationMs: Int(Date().timeIntervalSince(started) * 1000),
                                  skipped: .noTextDetected)
        }

        let request = VNRecognizeTextRequest()
        request.recognitionLevel = plan.level.vision
        request.recognitionLanguages = plan.languages
        request.usesLanguageCorrection = spec.defaults.usesLanguageCorrection

        let perClass = spec.perClass[category]
        if let height = perClass?.minimumTextHeight ?? spec.defaults.minimumTextHeight {
            request.minimumTextHeight = height
        }
        if let roi = perClass?.regionOfInterest {
            request.regionOfInterest = roi
        }

        try VNImageRequestHandler(cgImage: image, options: [:]).perform([request])

        let spans = (request.results ?? []).compactMap { observation -> TextSpan? in
            guard let candidate = observation.topCandidates(1).first else { return nil }
            return TextSpan(text: candidate.string,
                            boundingBox: observation.boundingBox,
                            confidence: Double(candidate.confidence))
        }

        return TextReadResult(spans: spans, plan: plan,
                              durationMs: Int(Date().timeIntervalSince(started) * 1000),
                              skipped: nil)
    }

    /// VNDetectTextRectangles — much cheaper than recognition, and only asked
    /// whether anything text-shaped is present.
    static func containsText(_ image: CGImage) throws -> Bool {
        let request = VNDetectTextRectanglesRequest()
        try VNImageRequestHandler(cgImage: image, options: [:]).perform([request])
        return !(request.results ?? []).isEmpty
    }

    // MARK: - Language selection

    /// Resolves requested languages against what this device can actually do.
    ///
    /// Unsupported languages are dropped rather than failing the request: a
    /// device that cannot read Thai should still read the English on the same
    /// receipt. Only an empty result disables the path.
    static func plan(spec: OCRSpec,
                     isScreenshot: Bool,
                     preferredLanguages: [String]) -> LanguagePlan {
        var level = spec.defaults.recognitionLevel

        // The instance method, not the type method: the latter is deprecated
        // and its revision argument is the thing that made it wrong to use.
        func supported(_ level: OCRSpec.Level) -> [String] {
            let request = VNRecognizeTextRequest()
            request.recognitionLevel = level.vision
            return (try? request.supportedRecognitionLanguages()) ?? []
        }

        let accurate = supported(.accurate)
        // Match on the language subtag: the device says "ko-KR" or just "ko",
        // Vision says "ko-KR", and one real entry is "vi-VT" where "vi-VN"
        // would be expected — so prefixes, not equality.
        func resolve(_ requested: [String], against available: [String]) -> [String] {
            var out: [String] = []
            for want in requested {
                let base = want.split(separator: "-").first.map(String.init) ?? want
                if let match = available.first(where: { $0 == want })
                    ?? available.first(where: { $0.hasPrefix(base + "-") || $0 == base }),
                   !out.contains(match) {
                    out.append(match)
                }
            }
            return out
        }

        var languages = Array(resolve(preferredLanguages, against: accurate)
            .prefix(spec.defaults.maxLanguages))
        let dropped = preferredLanguages.filter { want in
            let base = want.split(separator: "-").first.map(String.init) ?? want
            return !accurate.contains { $0 == want || $0.hasPrefix(base + "-") || $0 == base }
        }

        // Screenshots are digital text, so `.fast` loses nothing — but `.fast`
        // only knows six Latin languages, so this applies only when every
        // chosen language survives the switch. Measured, not assumed.
        if isScreenshot, spec.screenshot.preferFastWhenAllLatin, !languages.isEmpty {
            let fast = supported(.fast)
            if languages.allSatisfy(fast.contains) {
                level = .fast
            }
        }

        if languages.isEmpty, let fallback = accurate.first(where: { $0.hasPrefix("en") }) {
            // Never return nothing when English is available: an unreadable
            // locale should not turn a business card into an empty result.
            languages = [fallback]
        }

        return LanguagePlan(languages: languages, level: level, dropped: dropped)
    }
}
