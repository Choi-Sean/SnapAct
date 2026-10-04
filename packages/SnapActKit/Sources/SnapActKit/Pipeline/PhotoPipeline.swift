import CoreGraphics
import Foundation

/// Photo in, ranked buttons out.
///
/// Order is the design, not convenience:
///
///   1. Blocking gate — before anything else, so a Tier 0 photo is stopped
///      before OCR or any upload path could exist. It is a stub today and
///      still called first, so landing the real model does not mean
///      reordering a pipeline written around its absence.
///   2. Structural signals — metadata and fast Vision requests.
///   3. Routing — prefilter, then CLIP if the prefilter did not reject.
///   4. Candidates and ranking — so buttons can be shown NOW.
///   5. OCR, then arbitration, then re-ranking.
///
/// Steps 4 and 5 are split deliberately. The first OCR call costs ~1.6s
/// including pipeline setup, which is half of pipeline.md's 3s p90 budget;
/// waiting for it before showing anything would spend the whole budget on an
/// empty screen. `analyze` returns the fast result, `refine` folds in what OCR
/// found.
public struct PhotoPipeline: Sendable {
    public let catalog: ActionCatalog
    public let embeddings: ClassEmbeddings
    private let gate: any BlockingGate
    private let router: any PhotoRouter
    private let extractor: SignalExtractor
    private let textReader: TextReader
    private let corrector: TextCorrector
    private let generator: CandidateGenerator
    private let ranker: BayesianRanker
    private let counters: any ActionCounterStore

    public init(catalog: ActionCatalog,
                embeddings: ClassEmbeddings,
                routingConfig: RoutingConfig,
                ocrSpec: OCRSpec,
                rankingConfig: RankingConfig,
                embedder: any ImageEmbedder,
                arbiter: any TextArbiter,
                counters: any ActionCounterStore,
                gate: any BlockingGate = UntrainedGate()) {
        self.catalog = catalog
        self.embeddings = embeddings
        self.gate = gate
        self.router = CLIPRouter(embedder: embedder, classes: embeddings, config: routingConfig)
        self.extractor = SignalExtractor()
        self.textReader = TextReader(spec: ocrSpec)
        self.corrector = TextCorrector(arbiter: arbiter, classes: embeddings)
        self.generator = CandidateGenerator(catalog: catalog, config: rankingConfig)
        self.ranker = BayesianRanker(config: rankingConfig, store: counters)
        self.counters = counters
    }

    public struct Outcome: Sendable {
        public let gate: GateResult
        public let signals: SignalSet
        public let routing: RoutingResult
        public let ranking: RankingOutcome
        public let ocr: TextReadResult?
        public let correction: CategoryCorrection?
        public let context: ActionContext
        public let timings: Timings
        /// Categories offered, in order: the routed one, then anything
        /// arbitration added.
        public let categories: [CategoryID]

        public struct Timings: Sendable {
            public var gateMs = 0
            public var signalsMs = 0
            public var routingMs = 0
            public var rankingMs = 0
            public var ocrMs = 0
            public var arbitrationMs = 0
            public var totalMs: Int {
                gateMs + signalsMs + routingMs + rankingMs + ocrMs + arbitrationMs
            }
        }
    }

    /// Everything that can be done without OCR. Show these buttons now.
    public func analyze(_ image: CGImage,
                        sourceURL: URL? = nil,
                        profile: [String] = [],
                        deniedPermissions: Set<VerbID> = []) async throws -> Outcome {
        var timings = Outcome.Timings()

        var mark = Date()
        let gateResult = await gate.evaluate(image)
        timings.gateMs = Self.ms(since: mark)
        // A blocked photo stops here: no OCR, no routing, nothing uploaded.
        guard gateResult.allowsLocalProcessing else {
            return Outcome(gate: gateResult, signals: SignalSet(aspectRatio: 1),
                           routing: RoutingResult(category: .unknown, score: 0, margin: 0,
                                                  alternates: [], source: .fallback,
                                                  unknownReason: nil, structuralAdjustments: [:]),
                           ranking: RankingOutcome(actions: [], explorationApplied: false,
                                                   promoted: nil),
                           ocr: nil, correction: nil,
                           context: .now(profile: profile), timings: timings, categories: [])
        }

        mark = Date()
        let signals = await extractor.signals(for: image, sourceURL: sourceURL)
        timings.signalsMs = Self.ms(since: mark)

        mark = Date()
        let routing = try await router.route(image, signals: signals)
        timings.routingMs = Self.ms(since: mark)

        let context = ActionContext.now(
            profile: profile,
            captureDelay: sourceURL.map { SignalExtractor.captureDelay(for: $0) } ?? .recent,
            isScreenshot: signals.isScreenshot
        )

        mark = Date()
        let candidates = generator.candidates(for: routing.category, text: "",
                                              deniedPermissions: deniedPermissions)
        let ranking = ranker.rank(candidates, category: routing.category, context: context)
        timings.rankingMs = Self.ms(since: mark)

        return Outcome(gate: gateResult, signals: signals, routing: routing, ranking: ranking,
                       ocr: nil, correction: nil, context: context, timings: timings,
                       categories: [routing.category])
    }

    /// OCR, arbitration, and a re-rank with what the text revealed.
    ///
    /// Arbitration can only ADD a category; buttons already shown stay shown.
    public func refine(_ outcome: Outcome, image: CGImage,
                       deniedPermissions: Set<VerbID> = []) async throws -> Outcome {
        guard outcome.gate.allowsLocalProcessing else { return outcome }
        var timings = outcome.timings

        var mark = Date()
        // `unknown` is not one situation. The spec skips OCR for objects and
        // scenery, and that is what a negative top class or a prefilter
        // rejection means — there is no text in a photo of a dog.
        //
        // But an unknown produced by a threshold is a different thing
        // entirely: the photo may be dense with text and merely below the
        // confidence bar. Treating the two alike means that today, with
        // thresholds still null, EVERY photo is unknown and OCR never runs at
        // all — the whole text path silently dead.
        let ocr = try await textReader.read(image, category: outcome.routing.category,
                                      hasNothingToRead: Self.hasNothingToRead(outcome.routing),
                                      isScreenshot: outcome.signals.isScreenshot)
        timings.ocrMs = Self.ms(since: mark)

        mark = Date()
        let correction = await corrector.correct(outcome.routing, spans: ocr.spans)
        timings.arbitrationMs = Self.ms(since: mark)

        let categories = [outcome.routing.category] + correction.added
        let text = ocr.spans.map(\.text).joined(separator: "\n")

        mark = Date()
        let candidates = generator.candidates(for: outcome.routing.category,
                                              correctedTo: correction.added,
                                              text: text,
                                              deniedPermissions: deniedPermissions)
        let ranking = ranker.rank(candidates, category: outcome.routing.category,
                                  context: outcome.context)
        timings.rankingMs += Self.ms(since: mark)

        return Outcome(gate: outcome.gate, signals: outcome.signals, routing: outcome.routing,
                       ranking: ranking, ocr: ocr, correction: correction,
                       context: outcome.context, timings: timings, categories: categories)
    }

    /// Counts what was shown. Called when the buttons actually appear, not
    /// when they are computed — an impression the user never saw would poison
    /// the denominator.
    public func recordImpressions(_ outcome: Outcome) {
        counters.recordImpressions(category: outcome.routing.category,
                                   verbs: outcome.ranking.actions.map(\.verb))
    }

    public func recordClick(_ outcome: Outcome, verb: VerbID) {
        counters.recordClick(category: outcome.routing.category, verb: verb)
    }

    public func log(_ outcome: Outcome, embedding: [Float]?, chosen: VerbID?,
                    chosenOther: Bool = false,
                    computeDevices: MobileCLIPEncoder.ComputeDeviceSummary? = nil) -> InteractionLog {
        InteractionLog.make(routing: outcome.routing, embedding: embedding,
                            signals: outcome.signals, context: outcome.context,
                            ocr: outcome.ocr, arbitration: outcome.correction?.outcome,
                            ranking: outcome.ranking, chosen: chosen, chosenOther: chosenOther,
                            computeDevices: computeDevices)
    }

    /// True when the router's own reason says there is no text to find.
    static func hasNothingToRead(_ routing: RoutingResult) -> Bool {
        switch routing.unknownReason {
        case .topClassIsNegative, .prefilterRejected: return true
        case .scoreBelowThreshold, .marginBelowThreshold, .thresholdsNotConfigured, nil: return false
        }
    }

    private static func ms(since date: Date) -> Int {
        Int(Date().timeIntervalSince(date) * 1000)
    }
}

public extension PhotoPipeline {
    /// Wires everything from the bundled resources.
    static func bundled(embedder: (any ImageEmbedder)? = nil,
                        arbiter: (any TextArbiter)? = nil,
                        counters: (any ActionCounterStore)? = nil) throws -> PhotoPipeline {
        PhotoPipeline(
            catalog: try ActionCatalog.load(),
            embeddings: try ClassEmbeddings.load(),
            routingConfig: try RoutingConfig.load(),
            ocrSpec: try OCRSpec.load(),
            rankingConfig: try RankingConfig.load(),
            embedder: embedder ?? MobileCLIPEncoder(),
            arbiter: arbiter ?? FoundationModelsArbiter(),
            counters: counters ?? SharedCounterStore()
        )
    }
}
