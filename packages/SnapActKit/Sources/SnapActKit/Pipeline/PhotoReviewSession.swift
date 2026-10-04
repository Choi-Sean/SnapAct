import Foundation

/// One photo at a time, with the state a review screen needs between calls.
///
/// This exists because of a verification gap, not because the pipeline wanted
/// a wrapper. The Expo bridge in apps/expo/modules/snapact-kit cannot be
/// compiled on this machine — Xcode has the iOS SDK but not the iOS platform,
/// so `xcodebuild` answers "Found no destinations" for every iOS scheme. Any
/// logic the bridge owned outright would reach a device untested. So the
/// bridge keeps only the Expo plumbing (Name, AsyncFunction, the module
/// class), which is name-for-name the precedent in modules/coreml-classify,
/// and everything that reads this API lives here where `make test` runs it.
///
/// Holds the last outcome because recording a tap arrives as a second call
/// from JS, with nothing but a verb. Attributing that tap needs the photo's
/// routing and ranking, which only this side still has.
public final class PhotoReviewSession: @unchecked Sendable {
    private let lock = NSLock()
    private let counters: any ActionCounterStore
    private let logStore: (any InteractionLogStore)?
    private var pipeline: PhotoPipeline?
    private var lastOutcome: PhotoPipeline.Outcome?

    /// - Parameters:
    ///   - counters: defaults to the App Group store, so the share extension
    ///     and the app personalise from the same counts.
    ///   - logStore: nil disables logging rather than failing. A review screen
    ///     that cannot write its log is still worth running.
    public init(counters: (any ActionCounterStore)? = nil,
                logStore: (any InteractionLogStore)? = nil) {
        self.counters = counters ?? SharedCounterStore()
        self.logStore = logStore ?? (try? FileInteractionLogStore())
    }

    /// Built on first use and kept. The encoder compiles the Core ML model the
    /// first time it embeds, which costs seconds — rebuilding per photo would
    /// pay that every time.
    private func ensurePipeline() throws -> PhotoPipeline {
        try lock.withLock {
            if let pipeline { return pipeline }
            let built = try PhotoPipeline.bundled(arbiter: PhotoPipeline.defaultArbiter(),
                                                  counters: counters)
            pipeline = built
            return built
        }
    }

    /// Routes the photo and returns the refined result with the pre-OCR one
    /// attached under `"fast"`.
    ///
    /// Both phases are returned because the only way to see whether OCR and
    /// arbitration changed anything is to compare them. The fast path runs
    /// first for the reason the product needs it to: the first OCR call alone
    /// costs ~1.6s of a 3s budget, so buttons must not wait on it.
    public func analyzeDictionary(uri: String, profile: [String] = []) async throws -> [String: Any] {
        let pipeline = try ensurePipeline()
        let url = Self.fileURL(from: uri)
        let image = try PixelBuffer.downsample(url: url)

        var outcome = try await pipeline.analyze(image, sourceURL: url, profile: profile)
        pipeline.recordImpressions(outcome)
        let fast = outcome.asDictionary(phase: "fast")

        outcome = try await pipeline.refine(outcome, image: image)
        lock.withLock { lastOutcome = outcome }

        var refined = outcome.asDictionary(phase: "refined")
        refined["fast"] = fast
        return refined
    }

    /// Records that this verb was chosen for the last analyzed photo.
    ///
    /// Records only. Performing the action — Contacts, EventKit — is a later
    /// session, and nothing here reaches either.
    ///
    /// - Returns: false when there is no analysis to attribute the tap to,
    ///   rather than throwing: a stale tap is not an error worth an alert.
    @discardableResult
    public func recordChoice(verb: String) -> Bool {
        let (pipeline, outcome) = lock.withLock { (self.pipeline, self.lastOutcome) }
        guard let pipeline, let outcome else { return false }

        let chosen = VerbID(verb)
        pipeline.recordClick(outcome, verb: chosen)
        try? logStore?.append(pipeline.log(outcome, embedding: nil, chosen: chosen))
        return true
    }

    /// Clears the personalisation counters and the log, so a demo can start
    /// from the catalog's own ordering again.
    public func reset() {
        counters.reset()
        try? logStore?.clear()
    }

    public func exportLogJSONL() -> String {
        // `try?` over an optional chain already flattens to Data?.
        guard let data = try? logStore?.exportJSONL() else { return "" }
        return String(decoding: data, as: UTF8.self)
    }

    public func diagnosticsDictionary() -> [String: Any] {
        PhotoPipeline.diagnosticsDictionary(
            counterStoreShared: (counters as? SharedCounterStore)?.isSharedContainer ?? false)
    }

    /// expo-image-picker hands back `file://…`; a bare path is accepted too.
    static func fileURL(from uri: String) -> URL {
        if let url = URL(string: uri), url.isFileURL { return url }
        return URL(fileURLWithPath: uri)
    }
}
