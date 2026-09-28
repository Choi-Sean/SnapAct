import Foundation

/// Constants and weights for ranking, from Resources/ranking_config.json.
///
/// Hand-edited. Boost weights are null until real usage exists, and null means
/// not applied — the same rule as routing_config.json, for the same reason:
/// an invented weight is indistinguishable from a measured one once it is in
/// the file.
public struct RankingConfig: Decodable, Sendable {
    public let schemaVersion: Int
    public let smoothing: Smoothing
    public let exploration: Exploration
    public let preconditions: [VerbID: Precondition]
    public let permissionFallbacks: [VerbID: VerbID]
    public let contextBoosts: [String: VerbBoost]
    public let profileBoosts: [String: VerbBoost]

    public struct Smoothing: Decodable, Sendable {
        /// How much evidence it takes to overturn the default order.
        ///
        /// Measured against the spreadsheet's "three consecutive picks moves
        /// it to the top": with priors 0.70 / 0.45 / 0.35, alpha 10 flips the
        /// first secondary action on the third pick but the rest only on the
        /// fourth. Alpha 8 flips both on the third. Left at 10 as specified —
        /// see the test that measures it.
        public let alpha: Double
    }

    public struct Exploration: Decodable, Sendable {
        public let probability: Double
        /// How many positions count as "shown prominently".
        public let topK: Int
        /// 1-based, inclusive, the ranks eligible to be promoted.
        public let poolStart: Int
        public let poolEnd: Int
    }

    public struct Precondition: Decodable, Sendable {
        public let requiresText: Bool?
        public let requiresPattern: String?
    }

    public struct VerbBoost: Decodable, Sendable {
        public let verbs: [VerbID]
        public let boost: Double?
    }

    private enum CodingKeys: String, CodingKey {
        case schemaVersion, smoothing, exploration, preconditions
        case permissionFallbacks, contextBoosts, profileBoosts
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        schemaVersion = try container.decode(Int.self, forKey: .schemaVersion)
        smoothing = try container.decode(Smoothing.self, forKey: .smoothing)
        exploration = try container.decode(Exploration.self, forKey: .exploration)
        // "_note"/"_todo" keys sit alongside real entries in these maps.
        preconditions = try container.decodeMapSkippingComments(Precondition.self,
                                                                forKey: .preconditions)
            .reduce(into: [VerbID: Precondition]()) { $0[VerbID($1.key)] = $1.value }
        permissionFallbacks = try container.decodeMapSkippingComments(String.self,
                                                                      forKey: .permissionFallbacks)
            .reduce(into: [VerbID: VerbID]()) { $0[VerbID($1.key)] = VerbID($1.value) }
        contextBoosts = try container.decodeMapSkippingComments(VerbBoost.self, forKey: .contextBoosts)
        profileBoosts = try container.decodeMapSkippingComments(VerbBoost.self, forKey: .profileBoosts)
    }
}

public extension RankingConfig {
    static let supportedSchemaVersion = 1
    static let resourceName = "ranking_config"

    static func load(from bundle: Bundle? = nil) throws -> RankingConfig {
        let bundle = bundle ?? .module
        guard let url = bundle.url(forResource: resourceName, withExtension: "json") else {
            throw RankingError.resourceMissing(name: "\(resourceName).json")
        }
        let config = try JSONDecoder().decode(RankingConfig.self, from: Data(contentsOf: url))
        guard config.schemaVersion == supportedSchemaVersion else {
            throw RankingError.schemaMismatch(found: config.schemaVersion,
                                              expected: supportedSchemaVersion)
        }
        return config
    }

    var unconfiguredBoosts: [String] {
        (contextBoosts.filter { $0.value.boost == nil }.keys.map { "context.\($0)" }
         + profileBoosts.filter { $0.value.boost == nil }.keys.map { "profile.\($0)" }).sorted()
    }
}

public enum RankingError: Error, CustomStringConvertible {
    case resourceMissing(name: String)
    case schemaMismatch(found: Int, expected: Int)

    public var description: String {
        switch self {
        case .resourceMissing(let name): return "\(name) 이 번들에 없습니다."
        case .schemaMismatch(let found, let expected):
            return "ranking_config.json schemaVersion \(found), 이 빌드는 \(expected) 를 기대합니다."
        }
    }
}
