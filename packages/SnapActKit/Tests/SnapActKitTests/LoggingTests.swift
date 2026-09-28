import Testing
import CoreGraphics
import Foundation
@testable import SnapActKit

@Suite("로깅")
struct LoggingTests {

    /// Distinctive strings. If any of these reaches the log, it is findable.
    static let secretText = "홍길동 010-9876-5432 서울시 강남구 테헤란로 1"
    static let secretToken = "AMOXICILLIN-500MG-RX-8891"

    private func sampleLog(chosen: VerbID? = VerbID("save_note"),
                           ocrText: String = secretText) throws -> InteractionLog {
        let catalog = try ActionCatalog.load()
        let config = try RankingConfig.load()
        let store = InMemoryCounterStore()
        let category = CategoryID("receipt")

        let candidates = CandidateGenerator(catalog: catalog, config: config)
            .candidates(for: category, text: "합계 12,500원")
        let ranking = BayesianRanker(config: config, store: store)
            .rank(candidates, category: category,
                  context: ActionContext(hourBucket: .evening, isWeekend: true,
                                         captureDelay: .justNow, profile: ["expense"]))

        let routing = RoutingResult(
            category: category, score: 0.27, margin: 0.018,
            alternates: [ClassSimilarity(category: category, score: 0.27, isNegative: false),
                         ClassSimilarity(category: CategoryID("bill_invoice"), score: 0.252,
                                         isNegative: false)],
            source: .clip, unknownReason: nil, structuralAdjustments: [:]
        )
        let ocr = TextReadResult(
            spans: [TextSpan(text: ocrText, boundingBox: .init(x: 0, y: 0, width: 1, height: 0.2),
                             confidence: 0.94),
                    TextSpan(text: Self.secretToken, boundingBox: .zero, confidence: 0.9)],
            plan: LanguagePlan(languages: ["ko-KR"], level: .accurate, dropped: []),
            durationMs: 61, skipped: nil
        )
        return InteractionLog.make(
            routing: routing, embedding: [Float](repeating: 0.01, count: 512),
            signals: SignalSet(aspectRatio: 0.3, isScreenshot: false,
                               hasDocumentEdges: true, hasText: true),
            context: ActionContext(hourBucket: .evening, isWeekend: true,
                                   captureDelay: .justNow, profile: ["expense"]),
            ocr: ocr,
            arbitration: ArbitrationOutcome(verdict: .candidateA, declineReason: nil, durationMs: 40),
            ranking: ranking, chosen: chosen
        )
    }

    // MARK: - What must never be in there

    @Test("OCR 텍스트 내용이 로그 어디에도 없다")
    func ocrTextNeverReachesTheLog() throws {
        // A log that keeps recognised text is a log of somebody's addresses
        // and prescriptions. This searches the encoded bytes rather than
        // checking fields, so a field added later without thinking is caught.
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        let encoded = String(decoding: try encoder.encode(try sampleLog()), as: UTF8.self)

        #expect(!encoded.contains("홍길동"))
        #expect(!encoded.contains("010-9876-5432"))
        #expect(!encoded.contains("테헤란로"))
        #expect(!encoded.contains(Self.secretToken))
        #expect(!encoded.contains("AMOXICILLIN"))
    }

    @Test("텍스트의 존재와 길이는 남는다 — 학습에 필요한 것만")
    func keepsPresenceAndLengthOnly() throws {
        let log = try sampleLog()
        #expect(log.ocrPerformed)
        #expect(log.ocrSpanCount == 2)
        #expect(log.ocrCharacterCount == Self.secretText.count + Self.secretToken.count)
        #expect(log.ocrLanguages == ["ko-KR"])
    }

    @Test("임베딩은 남는다 — 사진이 사라지면 복원할 수 없다")
    func keepsEmbedding() throws {
        // The one thing here that cannot be recomputed later: the photo is
        // gone, so a period without embeddings is a period lost for the
        // eventual own-head router.
        let log = try sampleLog()
        #expect(log.embedding?.count == 512)
    }

    // MARK: - What must be in there

    @Test("보여준 액션을 전부 기록한다 — 클릭만으로는 학습이 안 된다")
    func recordsEveryShownAction() throws {
        let log = try sampleLog()
        let catalog = try ActionCatalog.load()
        let candidates = CandidateGenerator(catalog: catalog, config: try RankingConfig.load())
            .candidates(for: CategoryID("receipt"), text: "합계 12,500원")
        #expect(log.shown.count == candidates.count,
                "후보 \(candidates.count)개 중 \(log.shown.count)개만 기록됐습니다")
        #expect(Set(log.shown.map(\.position)) == Set(1 ... log.shown.count))
    }

    @Test("점수 분해가 보존된다 — 왜 이 순서였는지 나중에도 알 수 있게")
    func keepsScoreBreakdown() throws {
        let action = try #require(try sampleLog().shown.first)
        #expect(action.basePrior > 0)
        #expect(action.smoothedRate > 0)
        #expect(action.contextBoost == 1.0)   // weights are null today
        #expect(action.profileBoost == 1.0)
        #expect(action.naturalRank >= 1)
    }

    @Test("이탈과 OTHER 와 선택이 구분된다")
    func distinguishesAbandonment() throws {
        #expect(try sampleLog(chosen: VerbID("save_note")).chosen == "save_note")
        #expect(try sampleLog(chosen: nil).chosen == nil)

        let catalog = try ActionCatalog.load(), config = try RankingConfig.load()
        let candidates = CandidateGenerator(catalog: catalog, config: config)
            .candidates(for: CategoryID("receipt"), text: "x")
        let ranking = BayesianRanker(config: config, store: InMemoryCounterStore())
            .rank(candidates, category: CategoryID("receipt"),
                  context: .now())
        let other = InteractionLog.make(
            routing: RoutingResult(category: CategoryID("receipt"), score: 0.2, margin: 0.01,
                                   alternates: [], source: .clip, unknownReason: nil,
                                   structuralAdjustments: [:]),
            embedding: nil, signals: SignalSet(aspectRatio: 1),
            context: .now(), ocr: nil, arbitration: nil, ranking: ranking,
            chosen: nil, chosenOther: true)
        #expect(other.chosen == "OTHER")
    }

    @Test("가드레일 거부가 별도 필드로 남는다")
    func recordsGuardrailRefusal() throws {
        let catalog = try ActionCatalog.load(), config = try RankingConfig.load()
        let ranking = BayesianRanker(config: config, store: InMemoryCounterStore())
            .rank(CandidateGenerator(catalog: catalog, config: config)
                    .candidates(for: .unknown, text: "x"),
                  category: .unknown, context: .now())
        let log = InteractionLog.make(
            routing: RoutingResult(category: .unknown, score: 0.1, margin: 0.001,
                                   alternates: [], source: .clip,
                                   unknownReason: .thresholdsNotConfigured,
                                   structuralAdjustments: [:]),
            embedding: nil, signals: SignalSet(aspectRatio: 1), context: .now(), ocr: nil,
            arbitration: .declined(.guardrailRefused), ranking: ranking, chosen: nil)
        #expect(log.guardrailRefused)
        #expect(log.unknownReason?.contains("thresholdsNotConfigured") == true)
    }

    // MARK: - Store

    @Test("JSONL 로 append 되고 다시 읽힌다")
    func appendsAndReads() throws {
        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent("snapact-test-\(UUID().uuidString).jsonl")
        let store = try FileInteractionLogStore(url: url)
        defer { try? store.clear() }

        try store.append(try sampleLog())
        try store.append(try sampleLog(chosen: nil))
        let read = try store.readAll()
        #expect(read.count == 2)
        #expect(read[0].chosen == "save_note")
        #expect(read[1].chosen == nil)

        let exported = try store.exportJSONL()
        #expect(String(decoding: exported, as: UTF8.self).split(separator: "\n").count == 2)
    }

    @Test("깨진 줄 하나가 전체 이력을 못 읽게 만들지 않는다")
    func brokenLineDoesNotBreakEverything() throws {
        // An extension killed mid-write leaves a truncated final line. A JSON
        // array would be unreadable at that point; JSONL loses one row.
        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent("snapact-test-\(UUID().uuidString).jsonl")
        let store = try FileInteractionLogStore(url: url)
        defer { try? store.clear() }

        try store.append(try sampleLog())
        let handle = try FileHandle(forWritingTo: url)
        try handle.seekToEnd()
        try handle.write(contentsOf: Data(#"{"schemaVersion":1,"timestamp":"trunc"#.utf8))
        try handle.close()

        #expect(try store.readAll().count == 1)
    }

    @Test("clear 가 이력을 지운다")
    func clearEmptiesHistory() throws {
        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent("snapact-test-\(UUID().uuidString).jsonl")
        let store = try FileInteractionLogStore(url: url)
        try store.append(try sampleLog())
        try store.clear()
        #expect(try store.readAll().isEmpty)
    }

    @Test("컴퓨트 장치가 기록된다 — ANE 여부로 행을 걸러낼 수 있게")
    func recordsComputeDevices() async throws {
        // CPU and ANE disagree about the top class on 6.3% of real photos, so
        // a row is only comparable to another that ran on the same hardware.
        let summary = try await MobileCLIPEncoder().computeDeviceSummary()
        #expect(summary.total > 0)
        print("  컴퓨트 장치: \(summary.description) "
              + "(ANE 비율 \(String(format: "%.0f%%", summary.neuralEngineFraction * 100)))")
        #expect(summary.neuralEngineFraction > 0.9,
                "ANE 에서 안 돌고 있습니다: \(summary.description)")

        let encoded = try JSONEncoder().encode(summary)
        #expect(try JSONDecoder().decode(MobileCLIPEncoder.ComputeDeviceSummary.self,
                                         from: encoded) == summary)
    }
}
