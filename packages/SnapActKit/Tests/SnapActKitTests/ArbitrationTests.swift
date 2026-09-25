import Testing
import Foundation
@testable import SnapActKit

@Suite("OCR 중재")
struct ArbitrationTests {

    private func classes() throws -> ClassEmbeddings { try ClassEmbeddings.load() }

    private func span(_ text: String) -> TextSpan {
        TextSpan(text: text, boundingBox: .init(x: 0, y: 0, width: 1, height: 0.1), confidence: 0.9)
    }

    private func routed(_ category: String) -> RoutingResult {
        RoutingResult(category: CategoryID(category), score: 0.25, margin: 0.01,
                      alternates: [], source: .clip, unknownReason: nil,
                      structuralAdjustments: [:])
    }

    /// Answers whatever it is told to, so the correction logic can be tested
    /// without Apple Intelligence.
    struct ScriptedArbiter: TextArbiter {
        let verdict: ArbitrationOutcome.Verdict
        func arbitrate(text: String, candidateA: CategoryID,
                       candidateB: CategoryID) async -> ArbitrationOutcome {
            ArbitrationOutcome(verdict: verdict, declineReason: nil, durationMs: 1)
        }
    }

    // MARK: - Which pairs get arbitrated

    @Test("중재 대상은 needsOCRArbitration 이 정한다")
    func targetsComeFromTheData() throws {
        let corrector = TextCorrector(arbiter: UnavailableArbiter(), classes: try classes())
        #expect(corrector.arbitrationTargets(for: CategoryID("receipt"))
                == [CategoryID("bill_invoice")])
        #expect(corrector.arbitrationTargets(for: CategoryID("business_card")).isEmpty)
    }

    @Test("중재 대상이 없으면 아무것도 하지 않는다")
    func noTargetsMeansNoWork() async throws {
        let corrector = TextCorrector(arbiter: ScriptedArbiter(verdict: .candidateB),
                                      classes: try classes())
        let correction = await corrector.correct(routed("business_card"),
                                                 spans: [span("ACME Corp")])
        #expect(correction.added.isEmpty)
    }

    // MARK: - D-3: corrections add, never remove

    @Test("정정은 버튼을 추가만 한다 — 기존 것을 지우지 않는다")
    func correctionOnlyAdds() async throws {
        // The worst outcome is reaching for a button and finding it gone.
        let corrector = TextCorrector(arbiter: ScriptedArbiter(verdict: .candidateB),
                                      classes: try classes())
        let correction = await corrector.correct(routed("receipt"),
                                                 spans: [span("납부기한 2026-12-01")])
        #expect(correction.added == [CategoryID("bill_invoice")])
        // The originally routed category is untouched by the correction — it
        // is not in `added` because it was never removed.
        #expect(!correction.added.contains(CategoryID("receipt")))
    }

    @Test("원래 분류가 맞다고 나오면 추가할 것이 없다")
    func confirmingAddsNothing() async throws {
        let corrector = TextCorrector(arbiter: ScriptedArbiter(verdict: .candidateA),
                                      classes: try classes())
        let correction = await corrector.correct(routed("receipt"), spans: [span("합계 12,500원")])
        #expect(correction.added.isEmpty)
    }

    @Test("모델이 못 가리면 양쪽을 다 제시한다")
    func cannotTellOffersBoth() async throws {
        // It read the text and still could not decide, which is different from
        // not having run — keeping only the image's guess would discard that.
        let corrector = TextCorrector(arbiter: ScriptedArbiter(verdict: .cannotTell),
                                      classes: try classes())
        let correction = await corrector.correct(routed("receipt"), spans: [span("ACME")])
        #expect(correction.added == [CategoryID("bill_invoice")])
    }

    @Test("모델이 없으면 라우팅 결과를 그대로 둔다")
    func unavailableChangesNothing() async throws {
        let corrector = TextCorrector(arbiter: UnavailableArbiter(), classes: try classes())
        let correction = await corrector.correct(routed("receipt"), spans: [span("합계")])
        #expect(correction.added.isEmpty)
        #expect(correction.outcome.verdict == .declined)
    }

    @Test("OCR 텍스트가 없으면 중재하지 않는다")
    func noTextNoArbitration() async throws {
        let corrector = TextCorrector(arbiter: ScriptedArbiter(verdict: .candidateB),
                                      classes: try classes())
        let correction = await corrector.correct(routed("receipt"), spans: [])
        #expect(correction.added.isEmpty)
    }

    // MARK: - The real arbiter

    @Test("Apple Intelligence 가 없으면 조용히 실패하지 않고 사유를 남긴다")
    func realArbiterReportsUnavailability() async throws {
        let outcome = await FoundationModelsArbiter()
            .arbitrate(text: "합계 12,500원 2026-01-05",
                       candidateA: CategoryID("receipt"), candidateB: CategoryID("bill_invoice"))

        print("  FoundationModels: \(FoundationModelsArbiter.availabilityDescription)")
        if FoundationModelsArbiter.isAvailable {
            // On a machine with Apple Intelligence on, it must actually answer.
            #expect(outcome.verdict != .declined, "가용한데 거절했습니다: \(outcome)")
            print("  판정: \(outcome.verdict) (\(outcome.durationMs)ms)")
        } else {
            #expect(outcome.verdict == .declined)
            guard case .modelUnavailable(let detail)? = outcome.declineReason else {
                Issue.record("사유가 modelUnavailable 이 아닙니다: \(String(describing: outcome.declineReason))")
                return
            }
            #expect(!detail.isEmpty)
        }
    }

    @Test("@Generable 이 닫힌 스키마를 만든다 — 모델 없이도 검증되는 부분")
    func generableProducesClosedSchema() throws {
        // The macro expanding is what guarantees the model cannot answer with
        // a class name outside the pair, or with prose. Apple Intelligence is
        // not needed to check that the schema exists and is an enumeration.
        let schema = ArbitrationChoice.generationSchema
        let described = String(describing: schema)
        #expect(described.contains("first"))
        #expect(described.contains("second"))
        #expect(described.contains("cannotTell"))
    }

    @Test("빈 텍스트는 모델을 호출하지 않는다")
    func emptyTextSkipsModel() async throws {
        let outcome = await FoundationModelsArbiter()
            .arbitrate(text: "   \n  ", candidateA: CategoryID("receipt"),
                       candidateB: CategoryID("bill_invoice"))
        #expect(outcome.declineReason == .noText)
    }

    @Test("중재 쌍 설명이 내부 클래스명을 그대로 쓰지 않는다")
    func promptsDescribeRatherThanName() throws {
        // "bill_invoice" means nothing to a language model; "a future due date
        // and an account number" does.
        for name in ["receipt", "bill_invoice", "appointment_slip", "booking_screenshot"] {
            let described = FoundationModelsArbiter.describe(CategoryID(name))
            #expect(described != name, "\(name) 에 설명이 없습니다")
            #expect(described.count > 10)
        }
    }

    @Test("needsOCRArbitration 의 모든 클래스에 설명이 있다")
    func everyArbitrationTargetIsDescribed() throws {
        let embeddings = try classes()
        var missing: [String] = []
        for category in embeddings.categories {
            guard let entry = embeddings[category], !entry.needsOCRArbitration.isEmpty else { continue }
            for name in [category] + entry.needsOCRArbitration
            where FoundationModelsArbiter.describe(name) == name.rawValue {
                missing.append(name.rawValue)
            }
        }
        #expect(missing.isEmpty, "설명 없는 중재 대상: \(Set(missing).sorted())")
    }
}
