/// SnapActKit — turns a shared photo into a ranked list of action buttons.
///
/// The product problem is predicting the action list, not classifying the
/// photo: a category is a feature that helps rank actions, never the output.
/// That framing is why `Ranking` does not depend on `Routing` succeeding —
/// `.unknown` is the primary path, not a failure case.
///
/// Directory map, and which step fills each one:
///
///   Vision/    image embedding extraction (step 5)
///   Routing/   category decision + its protocol (step 6)
///   Catalog/   the action catalog parsed from Resources/actions.json (step 3)
///   Ranking/   candidate generation + Bayesian ranking (step 7)
///   Logging/   interaction log schema and local store (step 8)
///   Gate/      Tier 0 blocking gate (step 4 — stub; the model is untrained)
///
/// Everything is on-device. There is no networking code in this package, and
/// per the Gate contract there is deliberately no way to produce an
/// uploadable image while the gate model is unavailable.
public enum SnapActKit {
    /// Bumped when the on-disk shapes (actions.json, the interaction log)
    /// change in a way a reader must notice.
    public static let schemaVersion = 1
}
