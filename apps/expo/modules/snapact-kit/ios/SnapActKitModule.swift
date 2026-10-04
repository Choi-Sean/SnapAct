import ExpoModulesCore
import Foundation
import SnapActKit

/// Bridges packages/SnapActKit to the RN app.
///
/// Deliberately thin. The encoding — which is where the real risk of getting
/// the API wrong lives — is `Outcome.asDictionary` inside the package, where
/// `make test` can reach it; this file cannot be compiled on a machine whose
/// Xcode has no iOS platform, so anything it owns outright is unverified
/// until a device build runs.
///
/// Tapping a button is recorded and nothing else happens: performing actions
/// (Contacts, EventKit) is a later session. `recordChoice` updates the
/// counters and appends to the log; it executes nothing.
public final class SnapActKitModule: Module {
    /// Built once. The encoder compiles the Core ML model on first use, which
    /// costs seconds — rebuilding per photo would pay that every time.
    private var pipeline: PhotoPipeline?
    private var logStore: InteractionLogStore?
    private var lastOutcome: PhotoPipeline.Outcome?
    private let counters = SharedCounterStore()

    public func definition() -> ModuleDefinition {
        Name("SnapActKit")

        AsyncFunction("analyze") { (uri: String, profile: [String]?) -> [String: Any] in
            let pipeline = try self.ensurePipeline()
            let url = Self.fileURL(from: uri)
            let image = try PixelBuffer.downsample(url: url)

            // Fast path first, as the product should: buttons before OCR,
            // because the first OCR call alone costs ~1.6s of a 3s budget.
            var outcome = try await pipeline.analyze(image, sourceURL: url, profile: profile ?? [])
            pipeline.recordImpressions(outcome)
            let fast = outcome.asDictionary(phase: "fast")

            // Then refine, so the screen can show the OCR-informed ordering
            // and the difference between the two.
            outcome = try await pipeline.refine(outcome, image: image)
            self.lastOutcome = outcome
            var refined = outcome.asDictionary(phase: "refined")
            refined["fast"] = fast
            return refined
        }

        AsyncFunction("recordChoice") { (verb: String) -> Bool in
            guard let pipeline = self.pipeline, let outcome = self.lastOutcome else { return false }
            let chosen = VerbID(verb)
            pipeline.recordClick(outcome, verb: chosen)
            try? self.logStore?.append(pipeline.log(outcome, embedding: nil, chosen: chosen))
            return true
        }

        AsyncFunction("resetCounters") { () -> Bool in
            self.counters.reset()
            try? self.logStore?.clear()
            return true
        }

        AsyncFunction("exportLog") { () -> String in
            guard let data = try self.logStore?.exportJSONL() else { return "" }
            return String(decoding: data, as: UTF8.self)
        }

        Function("diagnostics") { () -> [String: Any] in
            PhotoPipeline.diagnosticsDictionary(counterStoreShared: self.counters.isSharedContainer)
        }
    }

    private func ensurePipeline() throws -> PhotoPipeline {
        if let pipeline { return pipeline }
        let built = try PhotoPipeline.bundled(arbiter: PhotoPipeline.defaultArbiter(),
                                              counters: counters)
        pipeline = built
        logStore = try? FileInteractionLogStore()
        return built
    }

    /// expo-image-picker hands back `file://…`; a bare path is accepted too.
    private static func fileURL(from uri: String) -> URL {
        if let url = URL(string: uri), url.isFileURL { return url }
        return URL(fileURLWithPath: uri)
    }
}
