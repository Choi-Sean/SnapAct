import Foundation

/// A verb from the catalog's vocabulary, as a type rather than a loose String.
///
/// Deliberately NOT an enum. Enumerating the cases here would put the action
/// list in Swift, and the spreadsheet would stop being the source of truth the
/// moment someone added a verb without touching this file. A wrapper gives the
/// compiler something to check in signatures — `perform(_ verb: VerbID)` cannot
/// be handed a category by mistake — while the set of valid values still comes
/// from actions.json and is enforced at load time.
public struct VerbID: Hashable, Sendable, RawRepresentable, CustomStringConvertible {
    public let rawValue: String
    public init(rawValue: String) { self.rawValue = rawValue }
    public init(_ rawValue: String) { self.rawValue = rawValue }
    public var description: String { rawValue }
}

/// A photo category from the catalog, plus the sentinel for "no category".
public struct CategoryID: Hashable, Sendable, RawRepresentable, CustomStringConvertible {
    public let rawValue: String
    public init(rawValue: String) { self.rawValue = rawValue }
    public init(_ rawValue: String) { self.rawValue = rawValue }
    public var description: String { rawValue }

    /// Not a catalog entry. pipeline.md treats `unknown` as the primary path —
    /// 60%+ of real traffic — so it is a first-class value, not a failure code.
    public static let unknown = CategoryID("unknown")
}

// Lets `[VerbID: Verb]` and `[CategoryID: PhotoClass]` decode straight from a
// JSON object instead of the key/value array Codable falls back to.
extension VerbID: Codable, CodingKeyRepresentable {
    public init?<T: CodingKey>(codingKey: T) { self.init(codingKey.stringValue) }
    public var codingKey: CodingKey { StringKey(rawValue) }
}

extension CategoryID: Codable, CodingKeyRepresentable {
    public init?<T: CodingKey>(codingKey: T) { self.init(codingKey.stringValue) }
    public var codingKey: CodingKey { StringKey(rawValue) }
}

/// Minimal CodingKey so the identifier wrappers above can act as dictionary
/// keys. Object keys are always strings, so the integer path is unreachable.
struct StringKey: CodingKey {
    let stringValue: String
    var intValue: Int? { nil }
    init(_ value: String) { stringValue = value }
    init?(stringValue: String) { self.stringValue = stringValue }
    init?(intValue: Int) { nil }
}
