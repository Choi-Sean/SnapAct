import Foundation
import SnapActKit

// 실제 FoundationModelsArbiter 로, 실제 쌍으로.
let arbiter = FoundationModelsArbiter()
print("availability: \(FoundationModelsArbiter.availabilityDescription)")

let cases: [(String, String, ArbitrationOutcome.Verdict)] = [
    ("2026-01-05  카드결제  합계 12,500원  감사합니다", "과거 영수증", .candidateA),
    ("납부기한 2026-12-31  입금계좌 110-234-567890  고객번호 88213", "미래 고지서", .candidateB),
    ("ACME 카페  서울시 강남구", "근거 없음", .cannotTell),
]
// 12회 반복. 1회만 보면 비결정성을 결론으로 착각한다.
let runs = 12
for (text, label, expected) in cases {
    var counts: [String: Int] = [:]
    var totalMs = 0
    for _ in 0 ..< runs {
        let o = await arbiter.arbitrate(text: text,
                                        candidateA: CategoryID("receipt"),
                                        candidateB: CategoryID("bill_invoice"))
        totalMs += o.durationMs
        let key: String
        switch o.declineReason {
        case .guardrailRefused: key = "GUARDRAIL"
        case .failed(let d):    key = d.contains("디코딩") ? "DECODE_EXHAUSTED" : "ERR"
        case .none:             key = "\(o.verdict)"
        default:                key = "\(o.declineReason!)"
        }
        counts[key, default: 0] += 1
    }
    let correct = counts["\(expected)"] ?? 0
    print("  \(label): 정답 \(correct)/\(runs)  평균 \(totalMs/runs)ms")
    print("     \(counts.sorted { $0.value > $1.value }.map { "\($0.key) \($0.value)" }.joined(separator: " · "))")
}

// 테스트는 병렬로 돈다. 순차 12/12 가 병렬에서도 유지되는지 재야 한다.
print("\n=== 동시 호출 (테스트 환경 재현) ===")
for concurrency in [2, 4, 8] {
    var counts: [String: Int] = [:]
    await withTaskGroup(of: String.self) { group in
        for _ in 0 ..< concurrency {
            group.addTask {
                let o = await arbiter.arbitrate(text: "2026-01-05  카드결제  합계 12,500원",
                                                candidateA: CategoryID("receipt"),
                                                candidateB: CategoryID("bill_invoice"))
                switch o.declineReason {
                case .none: return "\(o.verdict)"
                case .guardrailRefused: return "GUARDRAIL"
                case .failed(let d):
                    if d.contains("rateLimited") { return "RATE_LIMITED" }
                    if d.contains("concurrentRequests") { return "CONCURRENT" }
                    if d.contains("디코딩") { return "DECODE_EXHAUSTED" }
                    return "ERR:" + d.prefix(40)
                default: return "\(o.declineReason!)"
                }
            }
        }
        for await result in group { counts[result, default: 0] += 1 }
    }
    print("  동시 \(concurrency): \(counts.sorted { $0.value > $1.value }.map { "\($0.key) \($0.value)" }.joined(separator: " · "))")
}

// 재시도 0회로 단일 시도 실패율을 재고, 거기서 필요한 재시도 횟수를 계산한다.
print("\n=== 단일 시도 디코딩 실패율 (재시도 0회, 30회 반복) ===")
let noRetry = FoundationModelsArbiter(decodeRetries: 0)
var ok = 0, decode = 0, other = 0
for _ in 0 ..< 30 {
    let o = await noRetry.arbitrate(text: "2026-01-05  카드결제  합계 12,500원",
                                    candidateA: CategoryID("receipt"),
                                    candidateB: CategoryID("bill_invoice"))
    switch o.declineReason {
    case .none: ok += 1
    case .failed(let d) where d.contains("디코딩"): decode += 1
    default: other += 1
    }
}
let rate = Double(decode) / 30.0
print(String(format: "  성공 %d · 디코딩실패 %d · 기타 %d  → 단일 실패율 %.0f%%", ok, decode, other, rate * 100))
if rate > 0, rate < 1 {
    for retries in [2, 4, 6] {
        let residual = pow(rate, Double(retries + 1))
        print(String(format: "  재시도 %d회(총 %d시도) → 잔존 실패율 %.3f%%", retries, retries + 1, residual * 100))
    }
}
