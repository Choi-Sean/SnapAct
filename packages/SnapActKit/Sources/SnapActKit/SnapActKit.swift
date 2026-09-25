/// SnapActKit — turns a shared photo into a ranked list of action buttons.
///
/// The product problem is predicting the action list, not classifying the
/// photo: a category is a feature that helps rank actions, never the output.
/// That framing is why `Ranking` does not depend on `Routing` succeeding —
/// `unknown` is the primary path, not a failure case.
///
/// Directory map, and which step fills each one:
///
///   Vision/    CLIP embedding, prefilter, structural signals   (6, 7)
///   Routing/   PhotoRouter + CLIPRouter + FM text router       (7, 9)
///   OCR/       TextReader and its spec                         (8)
///   Catalog/   actions.json parsing                            (3)
///   Ranking/   candidate generation, Bayesian scoring, explore (10)
///   Logging/   interaction log schema                          (11)
///   Gate/      Tier 0 blocking gate — stub, model untrained    (4)
///   DebugUI/   SwiftUI review screen                           (12)
///
/// Everything is on-device. There is no networking code in this package, and
/// per the Gate contract there is deliberately no way to produce an
/// uploadable image while the gate model is unavailable.
public enum SnapActKit {
    /// Bumped when an on-disk shape (actions.json, class_embeddings.json, the
    /// interaction log) changes in a way a reader must notice.
    public static let schemaVersion = 1
}
