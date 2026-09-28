import Foundation

/// Thresholds and weights for routing, from Resources/routing_config.json.
///
/// Hand-edited, unlike actions.json — these are tuning parameters, not catalog
/// content. They live in a file rather than in Swift so changing one does not
/// need a code review, and so the debug screen can show what is actually in
/// effect.
///
/// **Every number here is nullable, and null means "not configured yet".**
/// Nothing is given an invented default. A router with no thresholds never
/// claims a category — it returns `unknown` and carries the full ranking, so
/// the numbers can be read off real photos and the thresholds set from
/// evidence instead of guessed and then defended.
public struct RoutingConfig: Decodable, Sendable {
    public let schemaVersion: Int
    public let thresholds: Thresholds
    public let prefilter: Prefilter
    public let structuralSignals: StructuralSignals

    public struct Thresholds: Decodable, Sendable {
        /// Top score below this means `unknown`.
        public let minScore: Double?
        /// Gap between first and second below this means `unknown` — the model
        /// can be confident and still be unable to choose.
        public let minMargin: Double?

        public var isConfigured: Bool { minScore != nil && minMargin != nil }
    }

    public struct Prefilter: Decodable, Sendable {
        public let enabled: Bool
        public let minConfidence: Double?
        /// Identifiers that exist in VNClassifyImageRequest's taxonomy. A
        /// label that does not exist there silently matches nothing, which is
        /// why these were taken from supportedIdentifiers() rather than
        /// written from memory.
        public let rejectLabels: [String]

        public var isConfigured: Bool { minConfidence != nil && !rejectLabels.isEmpty }
    }

    public struct StructuralSignals: Decodable, Sendable {
        public let aspectRatio: AspectRatio
        public let screenshot: Weighted
        public let documentEdges: Scoped
        public let textPresence: TextPresence

        public struct AspectRatio: Decodable, Sendable {
            public let boost: Double?
            public let penalty: Double?
            /// width / height windows, keyed by category.
            public let ranges: [CategoryID: [Double]]
        }

        public struct Weighted: Decodable, Sendable {
            public let boost: Double?
        }

        public struct Scoped: Decodable, Sendable {
            public let boost: Double?
            public let appliesTo: [CategoryID]
        }

        public struct TextPresence: Decodable, Sendable {
            public let penaltyWhenAbsent: Double?
            public let appliesTo: [CategoryID]
        }
    }
}

public extension RoutingConfig {
    static let supportedSchemaVersion = 1
    static let resourceName = "routing_config"

    static func load(from bundle: Bundle? = nil) throws -> RoutingConfig {
        let bundle = bundle ?? .module
        guard let url = bundle.url(forResource: resourceName, withExtension: "json") else {
            throw RoutingConfigError.resourceMissing(name: "\(resourceName).json")
        }
        let config = try JSONDecoder().decode(RoutingConfig.self, from: Data(contentsOf: url))
        guard config.schemaVersion == supportedSchemaVersion else {
            throw RoutingConfigError.schemaMismatch(found: config.schemaVersion,
                                                    expected: supportedSchemaVersion)
        }
        return config
    }

    /// What is still unset, for the debug screen to display rather than for
    /// anyone to discover by wondering why everything is `unknown`.
    var unconfigured: [String] {
        var missing: [String] = []
        if thresholds.minScore == nil { missing.append("thresholds.minScore") }
        if thresholds.minMargin == nil { missing.append("thresholds.minMargin") }
        if prefilter.enabled && prefilter.minConfidence == nil {
            missing.append("prefilter.minConfidence")
        }
        if structuralSignals.aspectRatio.boost == nil { missing.append("aspectRatio.boost") }
        if structuralSignals.screenshot.boost == nil { missing.append("screenshot.boost") }
        if structuralSignals.documentEdges.boost == nil { missing.append("documentEdges.boost") }
        if structuralSignals.textPresence.penaltyWhenAbsent == nil {
            missing.append("textPresence.penaltyWhenAbsent")
        }
        return missing
    }
}

public enum RoutingConfigError: Error, CustomStringConvertible {
    case resourceMissing(name: String)
    case schemaMismatch(found: Int, expected: Int)

    public var description: String {
        switch self {
        case .resourceMissing(let name): return "\(name) 이 번들에 없습니다."
        case .schemaMismatch(let found, let expected):
            return "routing_config.json schemaVersion \(found), 이 빌드는 \(expected) 를 기대합니다."
        }
    }
}
