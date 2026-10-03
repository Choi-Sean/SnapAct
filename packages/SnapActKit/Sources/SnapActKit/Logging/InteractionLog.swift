import Foundation

/// One share, from photo to whatever the user did about it.
///
/// This is the session's real output. Everything else can be rebuilt from the
/// spreadsheet and the model; this is the only record of what actually
/// happened, and a period without it is a period lost for good — the router
/// head and the ranking weights both need it as training data later.
///
/// **What is deliberately absent:** the photo, the OCR text, and the value of
/// any extracted field. A log that keeps them is a log of somebody's
/// prescriptions and home addresses. Presence and length are enough to learn
/// from, and are what is kept.
public struct InteractionLog: Codable, Sendable {
    public let schemaVersion: Int
    public let timestamp: Date

    // MARK: Routing
    public let category: String
    public let clipScore: Double
    public let clipMargin: Double
    public let routingSource: String
    public let unknownReason: String?
    /// Top five, with scores. The ranking is what makes an `unknown` useful in
    /// review; storing only the winner throws that away.
    public let topK: [ScoredCategory]
    /// 512 floats. Training data for the eventual own-head router, which is
    /// the one thing here that cannot be recomputed later — the photo is gone.
    public let embedding: [Float]?

    // MARK: Signals and context
    public let signals: [String: Bool]
    public let context: ContextBucket

    // MARK: OCR — metadata only
    public let ocrPerformed: Bool
    public let ocrDurationMs: Int?
    public let ocrSpanCount: Int?
    /// Character count, never the characters.
    public let ocrCharacterCount: Int?
    public let ocrLanguages: [String]?
    public let arbitrationVerdict: String?

    // MARK: What was offered and what happened
    /// EVERY action shown, in the order shown. A click-only log cannot express
    /// "offered and declined", which is most of the signal — an action shown
    /// twenty times and never tapped says a great deal, and is invisible
    /// without the denominator.
    public let shown: [ShownAction]
    /// The verb tapped, "OTHER" for the escape hatch, or nil if the user left.
    public let chosen: String?
    public let explorationApplied: Bool
    /// Where the encoder actually ran. CPU and Neural Engine disagree about
    /// the top class on 6.3% of real photos, so a row produced on the wrong
    /// hardware is not comparable to one produced on the right hardware —
    /// and without this field that difference is invisible in the data.
    public let computeDevices: MobileCLIPEncoder.ComputeDeviceSummary?
    /// The model declined to answer. Recorded separately because a refusal is
    /// evidence about our prompt, not about the photo.
    public let guardrailRefused: Bool

    public struct ScoredCategory: Codable, Sendable, Equatable {
        public let category: String
        public let score: Double
    }

    public struct ShownAction: Codable, Sendable, Equatable {
        public let verb: String
        /// 1-based, as displayed.
        public let position: Int
        public let score: Double
        /// The score decomposed, so a later reader can tell a strong prior
        /// from a learned preference without rerunning anything.
        public let basePrior: Double
        public let smoothedRate: Double
        public let contextBoost: Double
        public let profileBoost: Double
        public let impressions: Int
        public let clicks: Int
        /// Rank before exploration moved anything.
        public let naturalRank: Int
    }

    public struct ContextBucket: Codable, Sendable, Equatable {
        public let hourBucket: String
        public let isWeekend: Bool
        public let captureDelayBucket: String
        public let profile: [String]
    }
}

public extension InteractionLog {
    static let currentSchemaVersion = 1

    /// Builds a log from the pieces the pipeline produced.
    ///
    /// Takes the OCR result rather than its text so there is no call site that
    /// could pass the content in: the only way to get a character count here
    /// is to hand over the result and let this read `totalCharacters`.
    static func make(
        routing: RoutingResult,
        embedding: [Float]?,
        signals: SignalSet,
        context: ActionContext,
        ocr: TextReadResult?,
        arbitration: ArbitrationOutcome?,
        ranking: RankingOutcome,
        chosen: VerbID?,
        chosenOther: Bool = false,
        computeDevices: MobileCLIPEncoder.ComputeDeviceSummary? = nil,
        timestamp: Date = Date()
    ) -> InteractionLog {
        InteractionLog(
            schemaVersion: currentSchemaVersion,
            timestamp: timestamp,
            category: routing.category.rawValue,
            clipScore: routing.score,
            clipMargin: routing.margin,
            routingSource: routing.source.rawValue,
            unknownReason: routing.unknownReason.map { String(describing: $0) },
            topK: routing.alternates.prefix(5).map {
                ScoredCategory(category: $0.category.rawValue, score: $0.score)
            },
            embedding: embedding,
            signals: signals.asDictionary,
            context: ContextBucket(hourBucket: context.hourBucket.rawValue,
                                   isWeekend: context.isWeekend,
                                   captureDelayBucket: context.captureDelay.rawValue,
                                   profile: context.profile),
            ocrPerformed: ocr?.didRun ?? false,
            ocrDurationMs: ocr?.durationMs,
            ocrSpanCount: ocr?.spans.count,
            ocrCharacterCount: ocr?.totalCharacters,
            ocrLanguages: ocr?.plan?.languages,
            arbitrationVerdict: arbitration.map { String(describing: $0.verdict) },
            shown: ranking.actions.enumerated().map { index, action in
                ShownAction(verb: action.verb.rawValue, position: index + 1,
                            score: action.score, basePrior: action.candidate.basePrior,
                            smoothedRate: action.smoothedRate,
                            contextBoost: action.contextBoost,
                            profileBoost: action.profileBoost,
                            impressions: action.counter.impressions,
                            clicks: action.counter.clicks,
                            naturalRank: action.naturalRank)
            },
            chosen: chosenOther ? "OTHER" : chosen?.rawValue,
            explorationApplied: ranking.explorationApplied,
            computeDevices: computeDevices,
            guardrailRefused: arbitration?.declineReason == .guardrailRefused
        )
    }
}
