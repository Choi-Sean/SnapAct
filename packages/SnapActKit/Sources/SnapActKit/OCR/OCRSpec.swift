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
        perClass = try container.decodeMapSkippingComments(PerClass.self, forKey: .perClass)
            .reduce(into: [CategoryID: PerClass]()) { $0[CategoryID($1.key)] = $1.value }
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

public extension OCRSpec {
    static let supportedSchemaVersion = 1
    static let resourceName = "ocr_spec"

    static func load(from bundle: Bundle? = nil) throws -> OCRSpec {
        guard let url = bundle.map({ $0.url(forResource: resourceName, withExtension: "json") })
            ?? ResourceBundle.url(forResource: resourceName, withExtension: "json") else {
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
    /// - Parameter hasNothingToRead: the caller's judgement, not a lookup.
    ///   `unknown` is not one situation: a negative top class or a prefilter
    ///   rejection means a photo of a dog, while an unknown produced by a
    ///   confidence threshold may be covered in text. An earlier version had a
    ///   `skipUnknown` flag that treated both alike, and the effect was that
    ///   with thresholds still null EVERY photo was unknown and the entire
    ///   text path was silently dead. One flag, decided by the caller that
    ///   knows which kind it is holding — see PhotoPipeline.hasNothingToRead.
    func needsOCR(_ category: CategoryID, hasNothingToRead: Bool) -> Bool {
        if hasNothingToRead { return false }
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
