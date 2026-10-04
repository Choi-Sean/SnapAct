import Testing
import AppKit
import CoreGraphics
import Foundation
import ImageIO
@testable import SnapActKit

/// Drives the debug screen's model without the window, so the thing the
/// co-founder will look at is actually covered — a view that compiles proves
/// nothing about whether it will show numbers.
@Suite("디버그 화면")
@MainActor
struct DebugModelTests {

    private func imageURL(_ name: String) -> URL {
        URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()
            .appendingPathComponent("CrossValidation/images").appendingPathComponent(name)
    }

    /// Waits for the whole run, not just the first outcome. Some of what the
    /// screen shows — the compute-device summary — is gathered after the loop
    /// over photos, so returning early makes those fields look absent.
    private func settled(_ model: DebugModel, timeout: TimeInterval = 90) async throws {
        let deadline = Date().addingTimeInterval(timeout)
        var started = false
        while Date() < deadline {
            if model.isBusy { started = true }
            if started, !model.isBusy, model.rows.allSatisfy({ $0.outcome != nil || $0.error != nil }) {
                return
            }
            try await Task.sleep(for: .milliseconds(100))
        }
        Issue.record("분석이 \(timeout)초 안에 끝나지 않았습니다")
    }

    @Test("사진을 넣으면 분해 결과가 채워진다")
    func producesBreakdown() async throws {
        let model = DebugModel()
        model.add([imageURL("receipt_tall.png")])
        try await settled(model)

        let row = try #require(model.rows.first)
        #expect(row.error == nil, "오류: \(row.error ?? "")")
        let outcome = try #require(row.outcome)

        // Everything the screen promises to show must actually be there.
        #expect(!outcome.ranking.actions.isEmpty, "액션 표가 빈 채로 뜹니다")
        #expect(outcome.routing.alternates.count >= 5, "상위 5개 클래스를 못 보여줍니다")
        #expect(outcome.signals.aspectRatio > 0)
        #expect(outcome.ocr != nil, "OCR 패널에 보여줄 것이 없습니다")
        #expect(outcome.timings.totalMs > 0)
        #expect(model.memoryAfter != nil, "메모리 사용량을 못 보여줍니다")
        #expect(model.computeDevices != nil, "컴퓨트 장치를 못 보여줍니다")
    }

    @Test("점수 분해의 각 칸이 실제 값을 가진다")
    func breakdownColumnsArePopulated() async throws {
        let model = DebugModel()
        model.add([imageURL("card_landscape.png")])
        try await settled(model)

        let row = try #require(model.rows.first)
        let outcome = try #require(row.outcome)
        for action in outcome.ranking.actions {
            #expect(action.candidate.basePrior > 0)
            #expect(action.smoothedRate > 0)
            #expect(action.score > 0)
            #expect(action.naturalRank >= 1)
        }
    }

    @Test("탭하면 카운터가 오르고 로그가 남는다 — 실행은 하지 않는다")
    func tapRecordsWithoutExecuting() async throws {
        let counters = InMemoryCounterStore()
        let logs = InMemoryLogStore()
        let model = DebugModel(counters: counters, logs: logs)
        model.add([imageURL("square.png")])
        try await settled(model)

        let row = try #require(model.rows.first)
        let outcome = try #require(row.outcome)
        let topAction = try #require(outcome.ranking.actions.first)
        let verb = topAction.verb

        let before = counters.counter(category: outcome.routing.category, verb: verb)
        model.choose(verb, in: row)

        let after = counters.counter(category: outcome.routing.category, verb: verb)
        #expect(after.clicks == before.clicks + 1)
        #expect(model.logCount == 1)
        #expect(try logs.readAll().count == 1)
    }

    /// A PNG with real, distinctive text in it.
    ///
    /// The cross-validation images are abstract patterns, so OCR finds nothing
    /// in them — which made the first version of the export test vacuous: it
    /// looped over zero spans and passed no matter what the export contained.
    private func textImageURL(_ string: String) throws -> URL {
        let width = 900, height = 220
        let context = CGContext(data: nil, width: width, height: height, bitsPerComponent: 8,
                                bytesPerRow: 0, space: CGColorSpaceCreateDeviceRGB(),
                                bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
        context.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1))
        context.fill(CGRect(x: 0, y: 0, width: width, height: height))
        let font = CTFontCreateWithName("Helvetica" as CFString, 60, nil)
        let line = CTLineCreateWithAttributedString(NSAttributedString(
            string: string,
            attributes: [.font: font, .foregroundColor: CGColor(red: 0, green: 0, blue: 0, alpha: 1)]
        ))
        context.textPosition = CGPoint(x: 30, y: height / 2 - 20)
        CTLineDraw(line, context)

        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent("snapact-text-\(UUID().uuidString).png")
        let destination = CGImageDestinationCreateWithURL(url as CFURL, "public.png" as CFString,
                                                         1, nil)!
        CGImageDestinationAddImage(destination, context.makeImage()!, nil)
        CGImageDestinationFinalize(destination)
        return url
    }

    @Test("내보낸 JSONL 에 OCR 원문이 없다")
    func exportCarriesNoText() async throws {
        // The screen shows recognised text; the export must not carry it.
        let secret = "PATIENT KIM 010 5551 2048 AMOXICILLIN"
        let url = try textImageURL(secret)
        defer { try? FileManager.default.removeItem(at: url) }

        let logs = InMemoryLogStore()
        let model = DebugModel(counters: InMemoryCounterStore(), logs: logs)
        model.add([url])
        try await settled(model)

        let row = try #require(model.rows.first)
        let outcome = try #require(row.outcome)
        let topAction = try #require(outcome.ranking.actions.first)
        model.choose(topAction.verb, in: row)

        // The point of this test is that OCR actually read something.
        let spans = try #require(outcome.ocr?.spans)
        #expect(!spans.isEmpty, "OCR 이 아무것도 못 읽어 이 검사가 무의미합니다")

        let exported = String(decoding: model.exportJSONL(), as: UTF8.self)
        #expect(!exported.isEmpty)
        for fragment in ["PATIENT", "AMOXICILLIN", "5551", "2048"] {
            #expect(!exported.contains(fragment), "OCR 원문 '\(fragment)' 이 내보내기에 들어갔습니다")
        }
        for span in spans where span.text.count > 4 {
            #expect(!exported.contains(span.text), "OCR 원문이 내보내기에 들어갔습니다")
        }
        print("  OCR 이 읽은 것: \(spans.map(\.text).joined(separator: " | "))")
    }

    @Test("카운터 리셋이 화면에서 동작한다")
    func resetWorks() async throws {
        let counters = InMemoryCounterStore()
        let model = DebugModel(counters: counters, logs: InMemoryLogStore())
        model.add([imageURL("square.png")])
        try await settled(model)

        #expect(!counters.allCounters.isEmpty, "노출이 기록되지 않았습니다")
        model.resetCounters()
        #expect(counters.allCounters.isEmpty)
    }

    @Test("미설정 항목을 화면에 띄울 수 있다")
    func reportsUnconfigured() {
        // So "why is everything unknown" is answered on screen rather than by
        // reading JSON.
        #expect(!DebugModel().unconfigured.isEmpty)
    }
}
