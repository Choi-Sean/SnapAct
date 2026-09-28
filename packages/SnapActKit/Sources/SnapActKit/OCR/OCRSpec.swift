import Foundation
import Vision

/// Where OCR is worth paying for, and with what settings.
///
/// Read from Resources/ocr_spec.json rather than written in code because the
/// answer is a product decision that changes with evidence, and because
/// multilingual `.accurate` recognition costs hundreds of milliseconds to
/// seconds — the most expensive step in the pipeline by a wide margin.
public struct OCRSpec: Decodable, Sendable {
    public let schemaVersion: Int
    public let defaults: Defaults
    public let screenshot: Screenshot
    public let skipClasses: SkipClasses
    public let perClass: [CategoryID: PerClass]

    private enum CodingKeys: String, CodingKey {
        case schemaVersion, defaults, screenshot, skipClasses, perClass
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        schemaVersion = try container.decode(Int.self, forKey: .schemaVersion)
        defaults = try container.decode(Defaults.self, forKey: .defaults)
        screenshot = try container.decode(Screenshot.self, forKey: .screenshot)
        skipClasses = try container.decode(SkipClasses.self, forKey: .skipClasses)
        // These configs are hand-edited, so they carry "_note"/"_todo" keys
        // explaining each decision. Those sit alongside real entries inside
        // typed dictionaries, so they are filtered rather than banned — the
        // notes are worth more than the uniformity.
        perClass = try container.decodeIgnoringCommentKeys(
            [CategoryID: PerClass].self, forKey: .perClass)
    }

    public struct Defaults: Decodable, Sendable {
        public let recognitionLevel: Level
        public let usesLanguageCorrection: Bool
        public let maxLanguages: Int
        public let minimumTextHeight: Float?
    }

    public struct Screenshot: Decodable, Sendable {
        /// Screenshots are digital text, so `.fast` is safe — but only when
        /// every chosen language is one `.fast` actually supports.
        public let preferFastWhenAllLatin: Bool
    }

    public struct SkipClasses: Decodable, Sendable {
        public let classes: [CategoryID]
        public let skipUnknown: Bool
    }

    public struct PerClass: Decodable, Sendable {
        /// Vision coordinates, origin bottom-left, normalised. A wrong window
        /// silently truncates the text, so it stays null until measured.
        public let roi: [Double]?
        public let minimumTextHeight: Float?

        public var regionOfInterest: CGRect? {
            guard let roi, roi.count == 4 else { return nil }
            return CGRect(x: roi[0], y: roi[1], width: roi[2], height: roi[3])
        }
    }

    public enum Level: String, Decodable, Sendable {
        case fast, accurate

        var vision: VNRequestTextRecognitionLevel { self == .fast ? .fast : .accurate }
    }
}

extension KeyedDecodingContainer {
    /// Decodes a dictionary, dropping keys that begin with "_".
    ///
    /// JSON has no comments, and a hand-edited config that cannot explain
    /// itself gets edited wrongly. Underscore keys are the convention used
    /// across these files for that explanation.
    func decodeIgnoringCommentKeys<Value: Decodable>(
        _ type: [CategoryID: Value].Type, forKey key: Key
    ) throws -> [CategoryID: Value] {
        let raw = try decode([String: CommentOr<Value>].self, forKey: key)
        return raw.reduce(into: [CategoryID: Value]()) { result, entry in
            guard !entry.key.hasPrefix("_"), let value = entry.value.value else { return }
            result[CategoryID(entry.key)] = value
        }
    }
}

/// A value, or a comment string that should be skipped.
struct CommentOr<Value: Decodable>: Decodable {
    let value: Value?
    init(from decoder: Decoder) throws {
        if let string = try? decoder.singleValueContainer().decode(String.self) {
            _ = string
            value = nil
        } else {
            value = try Value(from: decoder)
        }
    }
}

public extension OCRSpec {
    static let supportedSchemaVersion = 1
    static let resourceName = "ocr_spec"

    static func load(from bundle: Bundle? = nil) throws -> OCRSpec {
        let bundle = bundle ?? .module
        guard let url = bundle.url(forResource: resourceName, withExtension: "json") else {
            throw OCRError.resourceMissing(name: "\(resourceName).json")
        }
        let spec = try JSONDecoder().decode(OCRSpec.self, from: Data(contentsOf: url))
        guard spec.schemaVersion == supportedSchemaVersion else {
            throw OCRError.schemaMismatch(found: spec.schemaVersion,
                                          expected: supportedSchemaVersion)
        }
        return spec
    }

    /// Whether this category is worth OCRing at all.
    ///
    /// `unknown` and the negatives are skipped because there is no text to act
    /// on in a photo of a dog — and OCR is the expensive step, so skipping it
    /// is most of what cost control means here.
    func needsOCR(_ category: CategoryID, isNegative: Bool) -> Bool {
        if isNegative { return false }
        if category == .unknown { return !skipClasses.skipUnknown }
        return !skipClasses.classes.contains(category)
    }
}

/// Which languages to ask Vision for, resolved against what it actually
/// supports at runtime.
///
/// Apple's documentation has been wrong about language support before — an
/// Apple engineer confirmed a WWDC video was incorrect about Swedish — so the
/// supported set is queried, never assumed. Note `vi-VT` in the real list,
/// where `vi-VN` would be the expected spelling: a config written from memory
/// would match nothing and fail silently.
public struct LanguagePlan: Sendable, Equatable {
    public let languages: [String]
    public let level: OCRSpec.Level
    /// Configured or preferred languages this device cannot recognise.
    public let dropped: [String]

    public var isEmpty: Bool { languages.isEmpty }
}

public enum OCRError: Error, Equatable, CustomStringConvertible {
    case resourceMissing(name: String)
    case schemaMismatch(found: Int, expected: Int)
    case noSupportedLanguage(requested: [String])

    public var description: String {
        switch self {
        case .resourceMissing(let name): return "\(name) 이 번들에 없습니다."
        case .schemaMismatch(let found, let expected):
            return "ocr_spec.json schemaVersion \(found), 이 빌드는 \(expected) 를 기대합니다."
        case .noSupportedLanguage(let requested):
            return "이 기기가 인식할 수 있는 언어가 없습니다: \(requested). 해당 경로를 비활성화합니다."
        }
    }
}
