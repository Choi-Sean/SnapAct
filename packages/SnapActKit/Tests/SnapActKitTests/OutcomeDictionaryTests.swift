import Testing
import CoreGraphics
import Foundation
@testable import SnapActKit

/// Covers what the Expo bridge sends to JS.
///
/// The bridge itself cannot be compiled here — Xcode on this machine has the
/// iOS SDK but not the iOS platform, so `xcodebuild` refuses every iOS
/// destination. These tests are the substitute: the encoding lives in the
/// package precisely so it can be reached from macOS.
@Suite("JS 로 넘기는 딕셔너리")
struct OutcomeDictionaryTests {

    private func imageURL(_ name: String) -> URL {
        URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()
            .appendingPathComponent("CrossValidation/images").appendingPathComponent(name)
    }

    private func pipeline() throws -> PhotoPipeline {
        PhotoPipeline(catalog: try ActionCatalog.load(), embeddings: try ClassEmbeddings.load(),
                      routingConfig: try RoutingConfig.load(), ocrSpec: try OCRSpec.load(),
                      rankingConfig: try RankingConfig.load(),
                      embedder: MobileCLIPEncoder(), arbiter: UnavailableArbiter(),
                      counters: InMemoryCounterStore(), gate: UntrainedGate())
    }

    /// Everything index.ts declares as non-optional must actually arrive.
    /// A missing key reads as `undefined` in JS and renders as blank space
    /// rather than as an error, so the screen would lie quietly.
    @Test("index.ts 가 필수라고 선언한 키가 모두 들어온다")
    func carriesEveryRequiredKey() async throws {
        let image = try PixelBuffer.downsample(url: imageURL("receipt_tall.png"))
        let outcome = try await pipeline().analyze(image, sourceURL: imageURL("receipt_tall.png"))
        let dict = outcome.asDictionary(phase: "fast")

        let required = ["phase", "category", "score", "margin", "source", "isUnknown",
                        "gateAllowsLocalProcessing", "gateModelAvailable", "categories",
                        "topClasses", "signals", "actions", "explorationApplied", "timings"]
        for key in required {
            #expect(dict[key] != nil, "\(key) 가 없습니다")
        }
        #expect(dict["phase"] as? String == "fast")

        let actions = try #require(dict["actions"] as? [[String: Any]])
        #expect(!actions.isEmpty, "버튼이 비어 있습니다")
        let first = try #require(actions.first)
        for key in ["position", "verb", "origin", "basePrior", "impressions", "clicks",
                    "smoothedRate", "contextBoost", "profileBoost", "score", "naturalRank"] {
            #expect(first[key] != nil, "action.\(key) 가 없습니다")
        }
        #expect(first["position"] as? Int == 1, "position 은 1-based 여야 합니다")
    }

    /// The reason for omitting rather than boxing: `Optional.none` inside
    /// `Any` does not survive the conversion to a JS value. If this ever
    /// regresses to `x as Any`, the value here stops being nil and becomes a
    /// box, and the first photo that skips OCR takes the app down.
    @Test("값이 없는 키는 nil 로 끼우지 않고 빼 버린다")
    func omitsAbsentKeysInsteadOfBoxingNil() async throws {
        let image = try PixelBuffer.downsample(url: imageURL("receipt_tall.png"))
        let outcome = try await pipeline().analyze(image, sourceURL: imageURL("receipt_tall.png"))
        let dict = outcome.asDictionary(phase: "fast")

        // The fast path has not run OCR or arbitration yet.
        #expect(outcome.ocr == nil)
        #expect(dict.index(forKey: "ocr") == nil, "ocr 키가 nil 을 담아 존재합니다")
        #expect(dict.index(forKey: "correction") == nil, "correction 키가 nil 을 담아 존재합니다")

        for (key, value) in dict {
            // `value as Any?` would unwrap a boxed Optional; `Optional<Any>`
            // reaching here at all is the bug being guarded against.
            let isBoxedNil = (value as AnyObject) is NSNull
                || String(describing: value) == "nil"
            #expect(!isBoxedNil, "\(key) 가 nil 을 박싱해 담고 있습니다")
        }
    }

    @Test("OCR 을 돌리면 텍스트와 언어 계획이 함께 실린다")
    func carriesOCRAfterRefine() async throws {
        let url = imageURL("receipt_tall.png")
        let image = try PixelBuffer.downsample(url: url)
        let pipeline = try pipeline()
        let refined = try await pipeline.refine(try await pipeline.analyze(image, sourceURL: url),
                                                image: image)
        let dict = refined.asDictionary(phase: "refined")
        let ocr = try #require(dict["ocr"] as? [String: Any], "refine 후에도 ocr 이 없습니다")
        #expect(ocr["performed"] != nil)
        #expect(ocr["characterCount"] != nil)
        // `text` is the only place content is carried, and only to the
        // screen. The log stores the count, which is asserted in LoggingTests.
        #expect(ocr["text"] != nil)
    }

    /// Serialisable all the way down. Expo converts the dictionary to a JS
    /// value and a type it cannot bridge throws at the boundary, inside the
    /// app, where it would read as "analysis failed" rather than as an
    /// encoding bug.
    @Test("JSON 으로 직렬화된다 — 브리지가 변환 못 하는 타입이 없다")
    func isFullyBridgeable() async throws {
        let url = imageURL("receipt_tall.png")
        let image = try PixelBuffer.downsample(url: url)
        let pipeline = try pipeline()
        let refined = try await pipeline.refine(try await pipeline.analyze(image, sourceURL: url),
                                                image: image)
        var dict = refined.asDictionary(phase: "refined")
        dict["fast"] = refined.asDictionary(phase: "fast")

        #expect(JSONSerialization.isValidJSONObject(dict),
                "딕셔너리에 브리지가 변환할 수 없는 타입이 있습니다")
        _ = try JSONSerialization.data(withJSONObject: dict)
    }

    @Test("진단에는 설정이 안 끝난 키들이 그대로 보인다")
    func diagnosticsReportUnconfiguredKeys() throws {
        let dict = PhotoPipeline.diagnosticsDictionary(counterStoreShared: false)
        #expect(dict["counterStoreShared"] as? Bool == false)
        #expect(dict["foundationModels"] != nil)
        #expect(dict["configError"] == nil, "번들에서 설정을 못 읽었습니다")

        let unconfigured = try #require(dict["unconfigured"] as? [String])
        // Thresholds are measured now; the structural and boost weights are
        // not, and the screen must keep saying so until they are.
        #expect(!unconfigured.isEmpty, "미설정 목록이 비었습니다 — 가중치가 모두 채워졌나요?")
        #expect(dict["minScore"] != nil, "측정된 임계값이 보이지 않습니다")
        #expect(JSONSerialization.isValidJSONObject(dict))
    }
}
