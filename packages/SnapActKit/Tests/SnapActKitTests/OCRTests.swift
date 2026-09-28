import Testing
import CoreGraphics
import Foundation
import Vision
@testable import SnapActKit

@Suite("OCR")
struct OCRTests {

    private func spec() throws -> OCRSpec { try OCRSpec.load() }

    private func image(named name: String) throws -> CGImage {
        let url = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()
            .appendingPathComponent("CrossValidation/images").appendingPathComponent(name)
        return try PixelBuffer.downsample(url: url, maxPixels: 2048)
    }

    /// Renders real text so recognition has something to find. Synthetic
    /// rectangles would only ever prove the plumbing.
    private func textImage(_ string: String, width: Int = 900, height: Int = 260) throws -> CGImage {
        let context = CGContext(data: nil, width: width, height: height, bitsPerComponent: 8,
                                bytesPerRow: 0, space: CGColorSpaceCreateDeviceRGB(),
                                bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
        context.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1))
        context.fill(CGRect(x: 0, y: 0, width: width, height: height))
        context.setFillColor(CGColor(red: 0, green: 0, blue: 0, alpha: 1))

        let font = CTFontCreateWithName("Helvetica" as CFString, 64, nil)
        let attributed = NSAttributedString(string: string, attributes: [
            .font: font, .foregroundColor: CGColor(red: 0, green: 0, blue: 0, alpha: 1),
        ])
        let line = CTLineCreateWithAttributedString(attributed)
        context.textPosition = CGPoint(x: 40, y: height / 2 - 20)
        CTLineDraw(line, context)
        return context.makeImage()!
    }

    // MARK: - Spec

    @Test("스펙이 로드된다")
    func loads() throws {
        let s = try spec()
        #expect(s.schemaVersion == OCRSpec.supportedSchemaVersion)
        #expect(s.defaults.maxLanguages > 0)
    }

    @Test("care_tag · 네거티브 · unknown 은 OCR 을 건너뛴다")
    func skipsWhereTextIsNotThePoint() throws {
        let s = try spec()
        // care_tag is laundry symbols, not text.
        #expect(!s.needsOCR(CategoryID("care_tag"), isNegative: false))
        #expect(!s.needsOCR(CategoryID("neg_food"), isNegative: true))
        #expect(!s.needsOCR(.unknown, isNegative: false))
        #expect(s.needsOCR(CategoryID("receipt"), isNegative: false))
        #expect(s.needsOCR(CategoryID("business_card"), isNegative: false))
    }

    @Test("skip 대상 클래스가 실재한다")
    func skipClassesExist() throws {
        let catalog = try ActionCatalog.load()
        for category in try spec().skipClasses.classes {
            #expect(catalog.classes[category] != nil, "\(category) 가 카탈로그에 없습니다")
        }
    }

    @Test("perClass 대상이 실재하고 roi 형식이 맞다")
    func perClassIsWellFormed() throws {
        let catalog = try ActionCatalog.load()
        for (category, entry) in try spec().perClass {
            #expect(catalog.classes[category] != nil, "\(category) 가 카탈로그에 없습니다")
            if let roi = entry.roi {
                #expect(roi.count == 4, "\(category) roi 원소가 4개가 아닙니다")
                #expect(roi.allSatisfy { $0 >= 0 && $0 <= 1 }, "\(category) roi 가 0~1 밖입니다")
            }
        }
    }

    // MARK: - Language selection

    @Test("한국어는 .accurate 로만 인식된다 — 문서가 아니라 런타임 조회 결과")
    func koreanForcesAccurate() throws {
        let plan = TextReader.plan(spec: try spec(), isScreenshot: true,
                                   preferredLanguages: ["ko-KR"])
        #expect(plan.languages.contains("ko-KR"))
        // .fast supports six Latin languages only, so the screenshot shortcut
        // must not fire here even though it is enabled.
        #expect(plan.level == .accurate, "한국어인데 .fast 로 내려갔습니다")
    }

    @Test("라틴 전용 스크린샷은 .fast 로 내려간다")
    func latinScreenshotUsesFast() throws {
        let plan = TextReader.plan(spec: try spec(), isScreenshot: true,
                                   preferredLanguages: ["en-US"])
        #expect(plan.level == .fast)
    }

    @Test("스크린샷이 아니면 라틴이어도 .accurate 를 유지한다")
    func nonScreenshotStaysAccurate() throws {
        let plan = TextReader.plan(spec: try spec(), isScreenshot: false,
                                   preferredLanguages: ["en-US"])
        #expect(plan.level == .accurate)
    }

    @Test("지원하지 않는 언어는 버리고 나머지로 진행한다")
    func dropsUnsupportedButKeepsGoing() throws {
        // A device that cannot read Klingon should still read the English on
        // the same receipt.
        let plan = TextReader.plan(spec: try spec(), isScreenshot: false,
                                   preferredLanguages: ["tlh-Piqd", "en-US"])
        #expect(plan.languages == ["en-US"])
        #expect(plan.dropped.contains("tlh-Piqd"))
    }

    @Test("언어 수가 maxLanguages 로 제한된다")
    func capsLanguageCount() throws {
        let s = try spec()
        let plan = TextReader.plan(spec: s, isScreenshot: false,
                                   preferredLanguages: ["ko-KR", "en-US", "ja-JP", "zh-Hans", "fr-FR"])
        #expect(plan.languages.count == s.defaults.maxLanguages)
    }

    @Test("설정된 언어가 하나도 없으면 영어로 폴백한다")
    func fallsBackToEnglish() throws {
        let plan = TextReader.plan(spec: try spec(), isScreenshot: false,
                                   preferredLanguages: ["tlh-Piqd"])
        #expect(!plan.isEmpty)
        #expect(plan.languages.first?.hasPrefix("en") == true)
    }

    // MARK: - Reading

    @Test("실제 텍스트를 span 으로 읽는다")
    func readsRealText() throws {
        let reader = TextReader(spec: try spec())
        let result = try reader.read(try textImage("SnapAct 1234 Main Street"),
                                     category: CategoryID("business_card"),
                                     preferredLanguages: ["en-US"])
        #expect(result.didRun)
        #expect(!result.spans.isEmpty, "텍스트를 하나도 못 읽었습니다")
        let joined = result.spans.map(\.text).joined(separator: " ")
        #expect(joined.contains("SnapAct") || joined.contains("1234"),
                "읽은 내용: \(joined)")
        print("  읽은 span \(result.spans.count)개, \(result.durationMs)ms, "
              + "언어 \(result.plan?.languages ?? [])")
    }

    @Test("한국어가 실제로 읽힌다 — 주 시장이고 .accurate 전용이다")
    func readsKorean() throws {
        let reader = TextReader(spec: try spec())
        let result = try reader.read(try textImage("영수증 합계 12,500원"),
                                     category: CategoryID("receipt"),
                                     preferredLanguages: ["ko-KR", "en-US"])
        #expect(result.didRun)
        #expect(result.plan?.level == .accurate)
        let joined = result.spans.map(\.text).joined()
        #expect(joined.contains("영수증") || joined.contains("12,500"),
                "한국어를 못 읽었습니다: \(joined)")
        print("  한국어: \(joined) (\(result.durationMs)ms)")
    }

    @Test(".fast 와 .accurate 의 비용 차이")
    func levelCostDiffers() throws {
        let reader = TextReader(spec: try spec())
        let image = try textImage("Invoice 2026 Total 48.20")
        // Warm up so the first-call pipeline setup is not attributed to .fast.
        _ = try reader.read(image, category: CategoryID("receipt"), preferredLanguages: ["en-US"])

        let accurate = try reader.read(image, category: CategoryID("receipt"),
                                       isScreenshot: false, preferredLanguages: ["en-US"])
        let fast = try reader.read(image, category: CategoryID("receipt"),
                                   isScreenshot: true, preferredLanguages: ["en-US"])
        #expect(accurate.plan?.level == .accurate)
        #expect(fast.plan?.level == .fast)
        print("  accurate \(accurate.durationMs)ms / fast \(fast.durationMs)ms"
              + "  (span \(accurate.spans.count) vs \(fast.spans.count))")
    }

    @Test("span 은 평탄화되지 않고 위치와 신뢰도를 보존한다")
    func spansKeepBoxesAndConfidence() throws {
        let reader = TextReader(spec: try spec())
        let result = try reader.read(try textImage("Total 12,500 KRW"),
                                     category: CategoryID("receipt"),
                                     preferredLanguages: ["en-US"])
        let span = try #require(result.spans.first)
        #expect(span.confidence > 0 && span.confidence <= 1)
        // Normalised Vision coordinates.
        #expect(span.boundingBox.width > 0 && span.boundingBox.width <= 1)
        #expect(span.boundingBox.minX >= 0 && span.boundingBox.maxY <= 1.0001)
    }

    @Test("텍스트가 없으면 인식을 돌리지 않는다")
    func skipsRecognitionWithoutText() throws {
        // The cheap detector exists so the expensive step is not paid for a
        // photo of a wall.
        let blank = CGContext(data: nil, width: 400, height: 400, bitsPerComponent: 8,
                              bytesPerRow: 0, space: CGColorSpaceCreateDeviceRGB(),
                              bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
        blank.setFillColor(CGColor(red: 0.6, green: 0.6, blue: 0.6, alpha: 1))
        blank.fill(CGRect(x: 0, y: 0, width: 400, height: 400))

        let result = try TextReader(spec: try spec())
            .read(blank.makeImage()!, category: CategoryID("receipt"),
                  preferredLanguages: ["en-US"])
        #expect(result.skipped == .noTextDetected)
        #expect(result.spans.isEmpty)
    }

    @Test("건너뛴 클래스는 OCR 비용을 전혀 내지 않는다")
    func skippedClassCostsNothing() throws {
        let result = try TextReader(spec: try spec())
            .read(try textImage("ignored"), category: CategoryID("care_tag"))
        #expect(result.skipped == .classDoesNotNeedOCR(CategoryID("care_tag")))
        #expect(result.durationMs == 0)
    }
}
