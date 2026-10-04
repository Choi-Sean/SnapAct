import Foundation
import SnapActKit

/// Measures the Foundation Models arbiter: accuracy, the guardrail, the
/// decoding failure rate, and behaviour under concurrency.
///
/// A single call tells you nothing here — @Generable fails to decode its own
/// model's output a fifth of the time — so everything is repeated.
///
///     swift run -c release ArbEval
@available(macOS 26, iOS 26, *)
func measure() async {
    let arbiter = FoundationModelsArbiter()
    print("availability: \(FoundationModelsArbiter.availabilityDescription)")

    let cases: [(String, String, ArbitrationOutcome.Verdict)] = [
        ("2026-01-05  카드결제  합계 12,500원  감사합니다", "과거 영수증", .candidateA),
        ("납부기한 2026-12-31  입금계좌 110-234-567890  고객번호 88213", "미래 고지서", .candidateB),
        ("ACME 카페  서울시 강남구", "근거 없음", .cannotTell),
    ]

    func label(_ outcome: ArbitrationOutcome) -> String {
        switch outcome.declineReason {
        case .none: return "\(outcome.verdict)"
        case .guardrailRefused: return "GUARDRAIL"
        case .failed(let detail):
            if detail.contains("디코딩") { return "DECODE_EXHAUSTED" }
            if detail.contains("rateLimited") { return "RATE_LIMITED" }
            return "ERR"
        default: return "\(outcome.declineReason!)"
        }
    }

    let runs = 12
    for (text, name, expected) in cases {
        var counts: [String: Int] = [:]
        var totalMs = 0
        for _ in 0 ..< runs {
            let outcome = await arbiter.arbitrate(text: text,
                                                  candidateA: CategoryID("receipt"),
                                                  candidateB: CategoryID("bill_invoice"))
            totalMs += outcome.durationMs
            counts[label(outcome), default: 0] += 1
        }
        print("  \(name): 정답 \(counts["\(expected)"] ?? 0)/\(runs)  평균 \(totalMs / runs)ms")
        print("     " + counts.sorted { $0.value > $1.value }
            .map { "\($0.key) \($0.value)" }.joined(separator: " · "))
    }

    // Tests run in parallel, so sequential success is not enough to trust.
    print("\n=== 동시 호출 ===")
    for concurrency in [2, 4, 8] {
        var counts: [String: Int] = [:]
        await withTaskGroup(of: String.self) { group in
            for _ in 0 ..< concurrency {
                group.addTask {
                    label(await arbiter.arbitrate(text: cases[0].0,
                                                  candidateA: CategoryID("receipt"),
                                                  candidateB: CategoryID("bill_invoice")))
                }
            }
            for await result in group { counts[result, default: 0] += 1 }
        }
        print("  동시 \(concurrency): " + counts.sorted { $0.value > $1.value }
            .map { "\($0.key) \($0.value)" }.joined(separator: " · "))
    }

    // The rate that sizes decodeRetries. Measured, not assumed.
    print("\n=== 단일 시도 디코딩 실패율 (재시도 0회, 30회) ===")
    let noRetry = FoundationModelsArbiter(decodeRetries: 0)
    var ok = 0, decode = 0, other = 0
    for _ in 0 ..< 30 {
        let outcome = await noRetry.arbitrate(text: cases[0].0,
                                              candidateA: CategoryID("receipt"),
                                              candidateB: CategoryID("bill_invoice"))
        switch outcome.declineReason {
        case .none: ok += 1
        case .failed(let d) where d.contains("디코딩"): decode += 1
        default: other += 1
        }
    }
    let rate = Double(decode) / 30.0
    print(String(format: "  성공 %d · 디코딩실패 %d · 기타 %d → 단일 실패율 %.0f%%",
                 ok, decode, other, rate * 100))
    if rate > 0, rate < 1 {
        for retries in [2, 4, 6] {
            print(String(format: "  재시도 %d회 → 잔존 %.3f%%", retries,
                         pow(rate, Double(retries + 1)) * 100))
        }
    }
}

if #available(macOS 26, iOS 26, *) {
    await measure()
} else {
    print("FoundationModels 는 iOS/macOS 26 이상에서만 동작합니다 — 이 OS 에서는 측정할 수 없습니다")
}
