import CoreGraphics
import Foundation

/// Decides what a photo is, or declines to.
///
/// A protocol because the backend is not settled. CLIP costs ~63 MB to load,
/// which may prove too much for a Share Extension; if it does, KNNRouter over
/// stored embeddings takes its place without the rest of the pipeline noticing.
public protocol PhotoRouter: Sendable {
    func route(_ image: CGImage, signals: SignalSet) async throws -> RoutingResult
}

public struct RoutingResult: Sendable {
    public let category: CategoryID
    /// Cosine of the winning class. Meaningless in isolation — image-to-class
    /// cosines sit around 0.02–0.22, nowhere near the 0.85+ of class-to-class.
    public let score: Double
    /// First minus second. A model can be confident and still unable to
    /// choose, which is a different failure from being unsure, and only this
    /// number separates them.
    public let margin: Double
    /// Full ranking, best first, including the winner and the negatives.
    /// Always populated — the debug screen needs it precisely when the answer
    /// is `unknown`.
    public let alternates: [ClassSimilarity]
    public let source: RoutingSource
    /// Why `unknown`, when it is.
    public let unknownReason: UnknownReason?
    public let structuralAdjustments: [CategoryID: Double]

    public var isUnknown: Bool { category == .unknown }
}

public enum RoutingSource: String, Sendable {
    case clip
    /// Rejected by VNClassifyImageRequest before CLIP ran at all.
    case prefilter
    /// CLIP was unavailable or failed; the pipeline continues on signals alone.
    case fallback
    case knn
}

public enum UnknownReason: Sendable, Equatable {
    /// Top class is one of the negatives — food, a pet, scenery.
    case topClassIsNegative(CategoryID)
    case scoreBelowThreshold(score: Double, threshold: Double)
    case marginBelowThreshold(margin: Double, threshold: Double)
    /// Rejected by the coarse classifier without paying for CLIP.
    case prefilterRejected(label: String, confidence: Double)
    /// Thresholds are still null in routing_config.json. Deliberately a
    /// distinct case: "we have not decided yet" is not the same answer as
    /// "this photo is unrecognisable", and conflating them would hide that
    /// the config is unfinished.
    case thresholdsNotConfigured
}

/// Cheap facts about the photo, gathered before CLIP and used to reweight it.
public struct SignalSet: Sendable, Equatable {
    /// width / height.
    public let aspectRatio: Double
    /// No EXIF camera make/model, and the pixel size matches a device screen.
    public let isScreenshot: Bool
    /// VNDetectDocumentSegmentationRequest found a page.
    public let hasDocumentEdges: Bool
    /// VNDetectTextRectangles found anything at all.
    public let hasText: Bool

    public init(aspectRatio: Double, isScreenshot: Bool = false,
                hasDocumentEdges: Bool = false, hasText: Bool = true) {
        self.aspectRatio = aspectRatio
        self.isScreenshot = isScreenshot
        self.hasDocumentEdges = hasDocumentEdges
        self.hasText = hasText
    }

    public var asDictionary: [String: Bool] {
        ["isScreenshot": isScreenshot,
         "hasDocumentEdges": hasDocumentEdges,
         "hasText": hasText]
    }
}

/// Placeholder for the replacement backend.
///
/// TODO(knn): if the Share Extension memory measurement rules MobileCLIP out
/// (~63 MB to load on the host; the figure that matters comes from a device),
/// this becomes a k-NN over embeddings already collected in the interaction
/// log. The seam exists now so that swap is a substitution rather than a
/// rewrite of everything downstream.
public struct KNNRouter: PhotoRouter {
    public init() {}

    public func route(_ image: CGImage, signals: SignalSet) async throws -> RoutingResult {
        throw RoutingError.notImplemented("KNNRouter")
    }
}

public enum RoutingError: Error, CustomStringConvertible {
    case notImplemented(String)

    public var description: String {
        switch self {
        case .notImplemented(let what): return "\(what) 는 아직 구현되지 않았습니다."
        }
    }
}
