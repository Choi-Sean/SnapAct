import CoreGraphics
import Foundation

/// The Tier 0 decision: may this photo be processed locally at all, and —
/// separately — may anything derived from it ever leave the device.
///
/// Runs at the very front of the pipeline, before OCR and before any upload
/// path exists. Vision-only by design: a blurry Korean ID yields no keywords,
/// so a gate that depended on OCR would turn an OCR failure into a leak
/// (docs/future-plan/rules/privacy.md).
public protocol BlockingGate: Sendable {
    func evaluate(_ image: CGImage) async -> GateResult
}

public struct GateResult: Sendable, Equatable {
    public let decision: GateDecision

    /// False while the classifier is still being trained in training/.
    ///
    /// This is deliberately NOT folded into `decision`. The two answer
    /// different questions, and conflating them is what would leak:
    ///   decision         — may we do local work on this photo?
    ///   modelAvailable   — do we actually know what this photo is?
    /// Only the second one gates egress. See UploadableImage.
    public let modelAvailable: Bool

    public init(decision: GateDecision, modelAvailable: Bool) {
        self.decision = decision
        self.modelAvailable = modelAvailable
    }

    public var allowsLocalProcessing: Bool { decision == .allowed }
}

public enum GateDecision: Sendable, Equatable {
    case allowed
    case blocked(Reason)

    /// There is no `unknown`. privacy.md is explicit: below threshold means
    /// blocked, never "probably fine".
    public enum Reason: Sendable, Equatable {
        /// The classifier put this in a Tier 0 class.
        case tierZero(CategoryID)
        /// Nothing scored high enough to claim `safe`. Fail closed.
        case notConfidentlySafe
        /// A blocking class scored above the suspicion threshold without being
        /// top. Suspicion alone is enough.
        case suspected(CategoryID)
    }
}

/// The gate as it exists this session: the model has not been trained, so it
/// reports that it does not know.
///
/// `.allowed` here means only "local processing may proceed" — the debug
/// screen, routing and ranking all need to run. It does not mean safe to
/// upload, and cannot be mistaken for it, because `modelAvailable` is false
/// and UploadableImage refuses on exactly that.
///
/// TODO(gate): replace with the trained classifier from training/.
/// Until then, do not add an `.allowed` path that sets modelAvailable = true.
public struct UntrainedGate: BlockingGate {
    public init() {}

    public func evaluate(_ image: CGImage) async -> GateResult {
        GateResult(decision: .allowed, modelAvailable: false)
    }
}
