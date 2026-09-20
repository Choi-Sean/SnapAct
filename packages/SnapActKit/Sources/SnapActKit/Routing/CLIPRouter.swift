import CoreGraphics
import Foundation
import Vision

/// Routes a photo by comparing its CLIP embedding against the precomputed
/// class embeddings, then reweighting with cheap structural facts.
///
/// Order is chosen for cost, not tidiness:
///
///   1. VNClassifyImageRequest prefilter — food, a pet, a beach. Rejecting
///      here skips the CLIP forward pass entirely.
///   2. CLIP embedding, cosine against all 45 classes.
///   3. Structural reweighting (aspect ratio, screenshot, document edges,
///      text presence) as multipliers.
///   4. The unknown decision.
///
/// `unknown` is not a failure path. pipeline.md expects it to be the majority
/// of real traffic, and the action list is built from universal and
/// signal-based actions regardless, so returning it costs the user nothing.
public struct CLIPRouter: PhotoRouter {
    private let embedder: ImageEmbedder
    private let classes: ClassEmbeddings
    private let config: RoutingConfig
    private let prefilter: ScenePrefilter?

    public init(embedder: ImageEmbedder,
                classes: ClassEmbeddings,
                config: RoutingConfig,
                prefilter: ScenePrefilter? = ScenePrefilter()) {
        self.embedder = embedder
        self.classes = classes
        self.config = config
        self.prefilter = prefilter
    }

    public func route(_ image: CGImage, signals: SignalSet) async throws -> RoutingResult {
        if config.prefilter.enabled, config.prefilter.isConfigured, let prefilter {
            if let rejection = try prefilter.rejection(for: image, config: config.prefilter) {
                return RoutingResult(
                    category: .unknown, score: rejection.confidence, margin: 0,
                    alternates: [], source: .prefilter,
                    unknownReason: .prefilterRejected(label: rejection.label,
                                                      confidence: rejection.confidence),
                    structuralAdjustments: [:]
                )
            }
        }

        let raw = try classes.similarities(to: try embedder.embed(image))
        let (adjusted, multipliers) = Self.applyStructuralSignals(
            to: raw, signals: signals, config: config.structuralSignals, classes: classes
        )

        guard let top = adjusted.first else {
            return RoutingResult(category: .unknown, score: 0, margin: 0, alternates: [],
                                 source: .clip, unknownReason: .thresholdsNotConfigured,
                                 structuralAdjustments: multipliers)
        }
        let margin = adjusted.count > 1 ? top.score - adjusted[1].score : top.score

        let reason = Self.unknownReason(top: top, margin: margin,
                                        thresholds: config.thresholds)
        return RoutingResult(
            category: reason == nil ? top.category : .unknown,
            score: top.score, margin: margin, alternates: adjusted,
            source: .clip, unknownReason: reason, structuralAdjustments: multipliers
        )
    }

    /// The fail-closed decision, in the order that makes each case reportable.
    static func unknownReason(top: ClassSimilarity, margin: Double,
                              thresholds: RoutingConfig.Thresholds) -> UnknownReason? {
        // A negative class winning is a decision, not an absence of one, so it
        // is checked before the thresholds and holds even while they are null.
        if top.isNegative { return .topClassIsNegative(top.category) }

        guard let minScore = thresholds.minScore, let minMargin = thresholds.minMargin else {
            // Nothing has been measured yet. Claiming the top class here would
            // be an invented threshold of zero wearing a disguise.
            return .thresholdsNotConfigured
        }
        if top.score < minScore {
            return .scoreBelowThreshold(score: top.score, threshold: minScore)
        }
        if margin < minMargin {
            return .marginBelowThreshold(margin: margin, threshold: minMargin)
        }
        return nil
    }

    /// Multiplies CLIP scores by structural evidence and re-sorts.
    ///
    /// Multiplicative rather than additive so a weight means the same thing
    /// wherever the raw score happens to sit — and image-to-class cosines are
    /// compressed into roughly 0.02–0.22, where a fixed additive bonus would
    /// swamp the signal it is supposed to nudge.
    static func applyStructuralSignals(
        to similarities: [ClassSimilarity],
        signals: SignalSet,
        config: RoutingConfig.StructuralSignals,
        classes: ClassEmbeddings
    ) -> ([ClassSimilarity], [CategoryID: Double]) {
        var multipliers: [CategoryID: Double] = [:]

        func multiply(_ category: CategoryID, by factor: Double?) {
            guard let factor else { return }   // null == not configured
            multipliers[category, default: 1.0] *= factor
        }

        for (category, window) in config.aspectRatio.ranges where window.count == 2 {
            let inside = signals.aspectRatio >= window[0] && signals.aspectRatio <= window[1]
            multiply(category, by: inside ? config.aspectRatio.boost : config.aspectRatio.penalty)
        }

        if signals.isScreenshot {
            for category in classes.categories where classes[category]?.screenshotBiased == true {
                multiply(category, by: config.screenshot.boost)
            }
        }

        if signals.hasDocumentEdges {
            for category in config.documentEdges.appliesTo {
                multiply(category, by: config.documentEdges.boost)
            }
        }

        if !signals.hasText {
            for category in config.textPresence.appliesTo {
                multiply(category, by: config.textPresence.penaltyWhenAbsent)
            }
        }

        guard !multipliers.isEmpty else { return (similarities, [:]) }

        let adjusted = similarities
            .map { ClassSimilarity(category: $0.category,
                                   score: $0.score * (multipliers[$0.category] ?? 1.0),
                                   isNegative: $0.isNegative) }
            .sorted { $0.score > $1.score }
        return (adjusted, multipliers)
    }
}

/// VNClassifyImageRequest used as a gate, never as a classifier.
///
/// Its 1303-label taxonomy has nothing to say about a business card, but it is
/// reliable about food, animals and beaches — which is all that is asked of it
/// here. Its only job is to make CLIP unnecessary for photos that were never
/// going to produce an action.
public struct ScenePrefilter: Sendable {
    public struct Rejection: Sendable { public let label: String; public let confidence: Double }

    public init() {}

    public func rejection(for image: CGImage,
                          config: RoutingConfig.Prefilter) throws -> Rejection? {
        guard let minConfidence = config.minConfidence else { return nil }

        let request = VNClassifyImageRequest()
        // perform(_:) is synchronous — callers must not be on the main queue
        // (ios-platform.md).
        try VNImageRequestHandler(cgImage: image, options: [:]).perform([request])

        let reject = Set(config.rejectLabels)
        guard let observations = request.results else { return nil }
        for observation in observations
        where reject.contains(observation.identifier)
            && Double(observation.confidence) >= minConfidence {
            return Rejection(label: observation.identifier,
                             confidence: Double(observation.confidence))
        }
        return nil
    }

    /// Labels in `rejectLabels` that Vision does not actually know. Such a
    /// label matches nothing and fails silently, so the debug screen surfaces
    /// it instead of letting the list quietly rot.
    public func unknownLabels(in config: RoutingConfig.Prefilter) -> [String] {
        guard let supported = try? VNClassifyImageRequest().supportedIdentifiers() else { return [] }
        return config.rejectLabels.filter { !Set(supported).contains($0) }.sorted()
    }
}
