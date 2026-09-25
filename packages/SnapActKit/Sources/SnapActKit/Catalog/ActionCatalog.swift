import Foundation

/// The parsed contents of Resources/actions.json.
///
/// Generated from docs/SnapAct_클래스별액션_검토.xlsx by tools/build_catalog.py.
/// Nothing in this package names a class or an action; the spreadsheet does,
/// and `make build` refuses to proceed if the JSON is older than the sheet.
///
/// The enums below are the SCHEMA, not the catalog. Tier, priority, layer and
/// confirmation are a closed grammar that the file format itself defines —
/// typing them is not the hardcoding the rule forbids, which is about the
/// vocabulary: which classes exist and which verbs they carry.
public struct ActionCatalog: Decodable, Sendable {
    public let schemaVersion: Int
    public let generatedFrom: String
    public let generatedAt: String
    /// sha256 of the spreadsheet this was generated from. Lets a build or a
    /// debug screen say "the catalog is stale" with certainty rather than
    /// comparing timestamps, which change when a file is merely opened.
    public let sourceSha256: String

    public let baseScores: BaseScores
    public let universalActions: [CatalogAction]
    public let verbs: [VerbID: Verb]
    public let classes: [CategoryID: PhotoClass]
    public let blockingClasses: [CategoryID: BlockingClass]
    public let rankingSignals: [RankingSignal]
}

public extension ActionCatalog {
    struct BaseScores: Decodable, Sendable {
        public let primary: Double
        public let secondaryFirst: Double
        public let secondaryRest: Double
        public let universal: Double
    }

    /// One button: which verb, what it is called, and its prior before any
    /// personalisation. Ranking multiplies this; it never reorders by it alone.
    struct CatalogAction: Decodable, Sendable, Hashable {
        public let verb: VerbID
        public let baseScore: Double
        /// Korean label from the spreadsheet. Absent on universal actions,
        /// which are named by the UI rather than per class.
        public let display: String?
    }

    struct Verb: Decodable, Sendable {
        public let api: String
        public let confirmation: Confirmation
        public let undoable: Bool
        public let note: String
    }

    /// How much ceremony a verb needs before it runs.
    ///
    /// Confirmation fatigue is answered by undo, not by removing confirmation,
    /// so `reversible` is the common case rather than a weaker `explicit`.
    enum Confirmation: String, Decodable, Sendable {
        case auto          // read-only; may run without asking
        case reversible    // one-tap confirm, undo afterwards
        case explicit      // full content shown, user commits
    }

    enum Tier: Int, Decodable, Sendable {
        case zero = 0      // never leaves the device
        case one = 1       // uploadable after consent
        case two = 2       // ordinary handling
    }

    enum Priority: String, Decodable, Sendable {
        case p1 = "P1", p2 = "P2", p3 = "P3"
    }

    /// Where a photo of this class stops costing work.
    enum TerminatingLayer: String, Decodable, Sendable {
        case l1 = "L1"     // classification is the whole answer
        case l3 = "L3"     // rule-based extraction
        case l5 = "L5"     // needs a language model
    }

    enum Resolution: String, Decodable, Sendable {
        case rules
        case llm
    }

    struct PhotoClass: Decodable, Sendable {
        public let id: Int
        public let motive: String
        public let situation: String
        public let priority: Priority
        public let tier: Tier
        public let terminatingLayer: TerminatingLayer
        public let extractionFields: [String]

        public let primary: [CatalogAction]
        public let secondary: [CatalogAction]
        /// Display strings from the sheet that no verb has been agreed for.
        /// Carried rather than dropped so the debug screen can show what is
        /// still undecided instead of the list looking complete.
        public let unmapped: [UnmappedAction]

        public let fallback: String
        public let promotionBasis: String
        public let pitfalls: String

        /// Groups classes that share a surface without merging them. health
        /// spans tiers 0, 1 and 2, so merging would drag a Tier 2 nutrition
        /// label into Tier 0 handling.
        public let group: String?
        /// Actions were inherited from this class at generation time; kept for
        /// provenance so the debug screen can say where they came from.
        public let aliasOf: CategoryID?
        public let resolution: Resolution
        public let maskingRules: [String]
        /// When the screenshot signal fires, offer these alongside rather than
        /// instead of this class. Ranking reorders; it never removes.
        public let coPresentWhenScreenshot: [CategoryID]
        /// False where the source is third-party content — a chat screenshot
        /// yields the appointment, never the conversation.
        public let retainsRawText: Bool
    }

    struct UnmappedAction: Decodable, Sendable {
        public let slot: String
        public let display: String
    }

    /// Tier 0. Present so the gate and the UI can name what they stopped, and
    /// deliberately carrying no actions: these classes are served locally.
    struct BlockingClass: Decodable, Sendable {
        public let id: Int
        public let visualDiscriminators: String
        public let userFacing: String
        public let provides: String
        public let confusionRisk: String
        public let tier: Tier
    }

    struct RankingSignal: Decodable, Sendable {
        public let signal: String
        public let source: String
        public let inference: String
        public let affects: String
    }
}
