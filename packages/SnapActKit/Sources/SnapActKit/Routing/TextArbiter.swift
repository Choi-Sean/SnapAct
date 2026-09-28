import Foundation

/// Settles a pair of classes that a photo cannot distinguish.
///
/// `receipt` and `bill_invoice` look identical — on 262 real receipts, 37%
/// were routed to bill_invoice. The difference is not visual: a past date
/// means a receipt, a future date plus an account number means a bill. Only
/// the text can say which.
///
/// A protocol so the arbiter can be stubbed. The real one needs Apple
/// Intelligence, which is not enabled everywhere, and the fallback is the path
/// that actually runs on most machines today.
public protocol TextArbiter: Sendable {
    func arbitrate(text: String,
                   candidateA: CategoryID,
                   candidateB: CategoryID) async -> ArbitrationOutcome
}

public struct ArbitrationOutcome: Sendable, Equatable {
    public let verdict: Verdict
    /// Why nothing was decided, when nothing was.
    public let declineReason: DeclineReason?
    public let durationMs: Int

    public enum Verdict: Sendable, Equatable {
        case candidateA
        case candidateB
        /// The model ran and could not tell. Different from not running.
        case cannotTell
        case declined
    }

    public enum DeclineReason: Sendable, Equatable {
        case modelUnavailable(String)
        /// The model refused. Recorded separately because a refusal is
        /// evidence about our prompt, not about the photo.
        case guardrailRefused
        case noText
        case failed(String)
    }

    public var decided: Bool { verdict == .candidateA || verdict == .candidateB }

    public static func declined(_ reason: DeclineReason, durationMs: Int = 0) -> ArbitrationOutcome {
        ArbitrationOutcome(verdict: .declined, declineReason: reason, durationMs: durationMs)
    }
}

/// What arbitration changes about a routing result.
///
/// Corrections only ever ADD. The worst outcome for a user is reaching for a
/// button and finding it gone, so a verdict promotes the other candidate
/// alongside the original rather than replacing it — ranking reorders, it
/// never removes (D-3).
public struct CategoryCorrection: Sendable, Equatable {
    /// Categories to offer in addition to whatever routing already produced.
    public let added: [CategoryID]
    public let outcome: ArbitrationOutcome

    public static let none = CategoryCorrection(added: [], outcome: .declined(.noText))
}

/// Applies arbitration to a routed result, for pairs that class_embeddings.json
/// marks as needing it.
public struct TextCorrector: Sendable {
    private let arbiter: any TextArbiter
    private let classes: ClassEmbeddings

    public init(arbiter: any TextArbiter, classes: ClassEmbeddings) {
        self.arbiter = arbiter
        self.classes = classes
    }

    /// Pairs worth asking about for this category, per needsOCRArbitration.
    public func arbitrationTargets(for category: CategoryID) -> [CategoryID] {
        classes[category]?.needsOCRArbitration ?? []
    }

    public func correct(_ result: RoutingResult, spans: [TextSpan]) async -> CategoryCorrection {
        let targets = arbitrationTargets(for: result.category)
        guard let other = targets.first else { return .none }
        guard !spans.isEmpty else { return .none }

        // Spans, joined only here and only to hand the model something to
        // read. The joined string is never stored or logged.
        let text = spans.map(\.text).joined(separator: "\n")
        let outcome = await arbiter.arbitrate(text: text,
                                              candidateA: result.category,
                                              candidateB: other)

        switch outcome.verdict {
        case .candidateA:
            // Routing was already right; nothing to add.
            return CategoryCorrection(added: [], outcome: outcome)
        case .candidateB:
            // Promote the other one ALONGSIDE, never instead of.
            return CategoryCorrection(added: [other], outcome: outcome)
        case .cannotTell:
            // The model read it and still could not tell, so offer both rather
            // than silently keeping only the image's guess.
            return CategoryCorrection(added: [other], outcome: outcome)
        case .declined:
            // Nothing ran. Leave the routing result exactly as it was.
            return CategoryCorrection(added: [], outcome: outcome)
        }
    }
}

/// Always declines. Used where Apple Intelligence is unavailable and in tests
/// that need the fallback path to be the path taken.
public struct UnavailableArbiter: TextArbiter {
    private let reason: ArbitrationOutcome.DeclineReason
    public init(reason: ArbitrationOutcome.DeclineReason = .modelUnavailable("스텁")) {
        self.reason = reason
    }
    public func arbitrate(text: String, candidateA: CategoryID,
                          candidateB: CategoryID) async -> ArbitrationOutcome {
        .declined(reason)
    }
}
