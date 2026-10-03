import Testing
import CoreGraphics
import Foundation
@testable import SnapActKit

@Suite("파이프라인")
struct PipelineTests {

    private func imageURL(_ name: String) -> URL {
        URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()
            .appendingPathComponent("CrossValidation/images").appendingPathComponent(name)
    }

    private func pipeline(counters: any ActionCounterStore = InMemoryCounterStore(),
                          gate: any BlockingGate = UntrainedGate()) throws -> PhotoPipeline {
        PhotoPipeline(catalog: try ActionCatalog.load(), embeddings: try ClassEmbeddings.load(),
                      routingConfig: try RoutingConfig.load(), ocrSpec: try OCRSpec.load(),
                      rankingConfig: try RankingConfig.load(),
                      embedder: MobileCLIPEncoder(), arbiter: UnavailableArbiter(),
                      counters: counters, gate: gate)
    }

    struct BlockingStubGate: BlockingGate {
        func evaluate(_ image: CGImage) async -> GateResult {
            GateResult(decision: .blocked(.tierZero(CategoryID("payment_card"))),
                       modelAvailable: true)
        }
    }

    @Test("사진 한 장이 끝까지 돌아 버튼이 나온다")
    func runsEndToEnd() async throws {
        let url = imageURL("receipt_tall.png")
        let image = try PixelBuffer.downsample(url: url)
        let pipeline = try pipeline()

        let fast = try await pipeline.analyze(image, sourceURL: url)
        // Thresholds are null so the class is unknown — and that must still
        // produce buttons, which is the whole point of universal actions.
        #expect(!fast.ranking.actions.isEmpty, "버튼이 하나도 없습니다")
        #expect(fast.ocr == nil, "빠른 경로에서 OCR 을 기다렸습니다")

        let refined = try await pipeline.refine(fast, image: image)
        #expect(refined.ocr != nil)
        let t = refined.timings
        print("  내역: gate \(t.gateMs) / signals \(t.signalsMs) / routing \(t.routingMs)"
              + " / ranking \(t.rankingMs) / ocr \(t.ocrMs) / arb \(t.arbitrationMs) = \(t.totalMs)ms")
        print("  분류 \(refined.routing.category) | OCR skipped: \(String(describing: refined.ocr?.skipped))")

        // Second run: the model is loaded, so this is the steady-state cost.
        let again = try await pipeline.analyze(image, sourceURL: url)
        print("  2회차 빠른 경로 \(again.timings.totalMs)ms (routing \(again.timings.routingMs)ms)")
    }

    @Test("차단된 사진은 OCR 도 라우팅도 하지 않는다")
    func blockedPhotoStopsImmediately() async throws {
        let url = imageURL("card_landscape.png")
        let image = try PixelBuffer.downsample(url: url)
        let pipeline = try pipeline(gate: BlockingStubGate())

        let outcome = try await pipeline.analyze(image, sourceURL: url)
        #expect(!outcome.gate.allowsLocalProcessing)
        #expect(outcome.ranking.actions.isEmpty)
        #expect(outcome.timings.routingMs == 0, "차단됐는데 라우팅을 돌렸습니다")

        // refine must also refuse rather than quietly OCRing a blocked photo.
        let refined = try await pipeline.refine(outcome, image: image)
        #expect(refined.ocr == nil)
    }

    @Test("게이트가 가장 먼저 호출된다")
    func gateRunsFirst() async throws {
        // Ordering is the guarantee: a Tier 0 photo must be stopped before OCR
        // or any upload path could exist.
        let url = imageURL("square.png")
        let outcome = try await pipeline(gate: BlockingStubGate())
            .analyze(try PixelBuffer.downsample(url: url), sourceURL: url)
        #expect(outcome.timings.gateMs >= 0)
        #expect(outcome.timings.signalsMs == 0)
    }

    @Test("구조 신호가 실제로 계산된다")
    func signalsAreComputed() async throws {
        let url = imageURL("wide.png")
        let outcome = try await pipeline().analyze(try PixelBuffer.downsample(url: url),
                                                   sourceURL: url)
        #expect(outcome.signals.aspectRatio > 3.0, "가로로 긴 이미지인데 \(outcome.signals.aspectRatio)")
        print("  신호: 종횡비 \(String(format: "%.2f", outcome.signals.aspectRatio))"
              + " 스크린샷 \(outcome.signals.isScreenshot)"
              + " 문서외곽 \(outcome.signals.hasDocumentEdges)"
              + " 텍스트 \(outcome.signals.hasText)")
    }

    @Test("노출과 클릭이 카운터에 반영된다")
    func recordsInteractions() async throws {
        let counters = InMemoryCounterStore()
        let url = imageURL("square.png")
        let image = try PixelBuffer.downsample(url: url)
        let pipeline = try pipeline(counters: counters)

        let outcome = try await pipeline.analyze(image, sourceURL: url)
        pipeline.recordImpressions(outcome)
        let first = try #require(outcome.ranking.actions.first)
        pipeline.recordClick(outcome, verb: first.verb)

        let counter = counters.counter(category: outcome.routing.category, verb: first.verb)
        #expect(counter.impressions == 1)
        #expect(counter.clicks == 1)
        // Everything shown got an impression, not just the clicked one.
        #expect(counters.allCounters.count == outcome.ranking.actions.count)
    }

    @Test("로그가 파이프라인 결과에서 만들어진다")
    func producesLog() async throws {
        let url = imageURL("receipt_tall.png")
        let image = try PixelBuffer.downsample(url: url)
        let pipeline = try pipeline()
        let outcome = try await pipeline.refine(try await pipeline.analyze(image, sourceURL: url),
                                                image: image)
        let log = pipeline.log(outcome, embedding: [Float](repeating: 0.02, count: 512),
                               chosen: outcome.ranking.actions.first?.verb)
        #expect(log.shown.count == outcome.ranking.actions.count)
        #expect(log.embedding?.count == 512)
        #expect(log.ocrPerformed == outcome.ocr?.didRun)
    }
}
