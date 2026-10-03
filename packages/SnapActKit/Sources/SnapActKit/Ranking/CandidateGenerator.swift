import Foundation

/// A button under consideration, before scoring.
public struct ActionCandidate: Sendable, Equatable {
    public let verb: VerbID
    public let display: String?
    public let basePrior: Double
    /// The slot weight before the class score scaled it. Lets the debug
    /// screen say whether a low prior came from the action's position or from
    /// the review's verdict on the class.
    public let slotScore: Double?
    public let origin: Origin

    public enum Origin: String, Sendable {
        case classPrimary
        case classSecondary
        /// Always present, on every class, including unknown.
        case universal
        /// Promoted by arbitration onto a second category.
        case corrected
        /// Substituted for a verb whose permission was refused.
        case permissionFallback
    }
}

/// Which buttons are even possible. Deterministic rules, never learned.
///
/// Whether an action CAN run is a fact — there is no SSID in this photo, the
/// contacts permission was refused, this is Tier 0 — and handing facts to a
/// model produces confident nonsense. Ranking scores what survives; it does
/// not decide what is possible.
public struct CandidateGenerator: Sendable {
    private let catalog: ActionCatalog
    private let config: RankingConfig

    public init(catalog: ActionCatalog, config: RankingConfig) {
        self.catalog = catalog
        self.config = config
    }

    /// - Parameters:
    ///   - text: OCR output, for preconditions. Empty is normal, not an error.
    ///   - deniedPermissions: verbs whose permission the user refused.
    public func candidates(for category: CategoryID,
                           correctedTo extra: [CategoryID] = [],
                           text: String = "",
                           deniedPermissions: Set<VerbID> = []) -> [ActionCandidate] {
        var out: [ActionCandidate] = []
        var seen: Set<VerbID> = []

        func append(_ action: ActionCatalog.CatalogAction, _ origin: ActionCandidate.Origin) {
            guard !seen.contains(action.verb) else { return }
            seen.insert(action.verb)
            out.append(ActionCandidate(verb: action.verb, display: action.display,
                                       basePrior: action.baseScore,
                                       slotScore: action.slotScore, origin: origin))
        }

        if let photoClass = catalog[category] {
            photoClass.primary.forEach { append($0, .classPrimary) }
            photoClass.secondary.forEach { append($0, .classSecondary) }
        }
        // Arbitration promotes a second category ALONGSIDE; its actions join
        // rather than replace (D-3).
        for other in extra {
            guard let photoClass = catalog[other] else { continue }
            (photoClass.primary + photoClass.secondary).forEach { append($0, .corrected) }
        }
        // Always, for every class including unknown — which pipeline.md
        // expects to be the majority of traffic. This is why an empty class
        // action list is never an empty screen.
        catalog.universalActions.forEach { append($0, .universal) }

        let tier = catalog[category]?.tier
        return out
            .filter { satisfiesPreconditions($0.verb, text: text) }
            .filter { tier != .zero || !ActionCatalog.networkEgressVerbs.contains($0.verb) }
            .map { substituteIfDenied($0, deniedPermissions: deniedPermissions) }
            .reduce(into: [ActionCandidate]()) { result, candidate in
                // Substitution can collide with a verb already present.
                guard !result.contains(where: { $0.verb == candidate.verb }) else { return }
                result.append(candidate)
            }
    }

    func satisfiesPreconditions(_ verb: VerbID, text: String) -> Bool {
        guard let precondition = config.preconditions[verb] else { return true }
        if precondition.requiresText == true, text.isEmpty { return false }
        if let pattern = precondition.requiresPattern {
            guard text.range(of: pattern, options: .regularExpression) != nil else { return false }
        }
        return true
    }

    /// A refused permission replaces the verb rather than removing the button.
    /// "Save contact" becoming "Export vCard" keeps the user's intent
    /// reachable; removing it makes the app look broken.
    func substituteIfDenied(_ candidate: ActionCandidate,
                            deniedPermissions: Set<VerbID>) -> ActionCandidate {
        guard deniedPermissions.contains(candidate.verb),
              let fallback = config.permissionFallbacks[candidate.verb] else { return candidate }
        return ActionCandidate(verb: fallback, display: candidate.display,
                               basePrior: candidate.basePrior,
                               slotScore: candidate.slotScore, origin: .permissionFallback)
    }
}
