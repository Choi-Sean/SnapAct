import FoundationModels
import Foundation

/// Structured output with a closed set of answers.
///
/// An enum, not a string. The model cannot name a class that is not one of the
/// two being compared, cannot invent a third, and cannot return prose that
/// would then need parsing — the failure mode where a model says "it looks
/// like a receipt, but…" and a regex decides what that meant.
///
/// The cases are positional rather than named after classes because the pair
/// is chosen at runtime from needsOCRArbitration; the prompt says which is
/// which.
@available(iOS 26, macOS 26, *)
@Generable
enum ArbitrationChoice {
    /// The first of the two descriptions in the prompt.
    case first
    /// The second.
    case second
    /// Read it and genuinely cannot tell. A real answer, not a failure.
    case cannotTell
}

/// Arbitrates using the on-device model.
///
/// Tier 0 safe: Foundation Models runs entirely on the device, so text from a
/// prescription or an ID never leaves it (pipeline.md, L5a).
///
/// The model is NOT available everywhere — Apple Intelligence has to be
/// enabled, and on a machine where it is not, `availability` reports
/// `appleIntelligenceNotEnabled` and every call declines. That is the common
/// path today and it is the one exercised by the tests here.
/// Gated to iOS 26 because FoundationModels does not exist before it. The rest
/// of the package deliberately does not depend on that floor — routing, OCR,
/// candidates and ranking all build against iOS 17 — so the app can ship to
/// older devices and simply never get arbitration there. `PhotoPipeline`
/// substitutes a declining arbiter below 26, which is the same path a device
/// with Apple Intelligence switched off already takes.
@available(iOS 26, macOS 26, *)
public struct FoundationModelsArbiter: TextArbiter {
    /// Long OCR output is truncated: the discriminating facts (a date, an
    /// account number, a total) are near the start or end, and the context
    /// window is not free.
    public let maxCharacters: Int

    /// How many times to re-ask after a decoding failure.
    ///
    /// Not defensive padding. Measured over 30 identical calls with retries
    /// off, 7 failed to decode — a 23% single-attempt failure rate, with the
    /// error `Unexpected value " first"`. The model emits a LEADING SPACE and
    /// @Generable's generated decoder rejects its own model's output. Nothing
    /// in this package can fix that, so the only lever is to ask again.
    ///
    /// Sizing follows from the rate: 2 retries leaves 1.3% residual, which is
    /// often enough to break a test run; 4 leaves 0.07%. Each attempt costs
    /// roughly 0.5s and only happens on the failure path.
    public let decodeRetries: Int

    public init(maxCharacters: Int = 2000, decodeRetries: Int = 4) {
        self.maxCharacters = maxCharacters
        self.decodeRetries = decodeRetries
    }

    public static var availabilityDescription: String {
        switch SystemLanguageModel.default.availability {
        case .available: return "available"
        case .unavailable(let reason): return "unavailable(\(reason))"
        @unknown default: return "unknown"
        }
    }

    public static var isAvailable: Bool {
        if case .available = SystemLanguageModel.default.availability { return true }
        return false
    }

    public func arbitrate(text: String,
                          candidateA: CategoryID,
                          candidateB: CategoryID) async -> ArbitrationOutcome {
        guard !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            return .declined(.noText)
        }
        // Checked every call rather than cached: Apple Intelligence can be
        // switched on, and the model can be downloading.
        guard case .available = SystemLanguageModel.default.availability else {
            return .declined(.modelUnavailable(Self.availabilityDescription))
        }

        let started = Date()
        let prompt = Self.prompt(text: String(text.prefix(maxCharacters)),
                                 candidateA: candidateA, candidateB: candidateB,
                                 today: Date())
        var lastDecodeError: String?

        for _ in 0 ... decodeRetries {
            // A fresh session each attempt: the previous turn is in the
            // transcript otherwise, and re-asking inside a conversation that
            // already failed is a different question.
            let session = LanguageModelSession(instructions: Self.instructions)
            do {
                let response = try await session.respond(to: prompt,
                                                         generating: ArbitrationChoice.self)
                let ms = Int(Date().timeIntervalSince(started) * 1000)
                switch response.content {
                case .first:
                    return ArbitrationOutcome(verdict: .candidateA, declineReason: nil, durationMs: ms)
                case .second:
                    return ArbitrationOutcome(verdict: .candidateB, declineReason: nil, durationMs: ms)
                case .cannotTell:
                    return ArbitrationOutcome(verdict: .cannotTell, declineReason: nil, durationMs: ms)
                }
            } catch let error as LanguageModelSession.GenerationError {
                switch error {
                case .guardrailViolation, .refusal:
                    // Deterministic for a given input, so retrying is pointless
                    // — measured 12/12 on ordinary Korean billing text. Recorded
                    // separately because a refusal says something about our
                    // prompt, not about the photo.
                    return .declined(.guardrailRefused,
                                     durationMs: Int(Date().timeIntervalSince(started) * 1000))
                case .decodingFailure(let context):
                    lastDecodeError = context.debugDescription
                    continue   // the only failure worth re-asking about
                default:
                    return .declined(.failed(String(describing: error)),
                                     durationMs: Int(Date().timeIntervalSince(started) * 1000))
                }
            } catch {
                return .declined(.failed(String(describing: error)),
                                 durationMs: Int(Date().timeIntervalSince(started) * 1000))
            }
        }
        return .declined(.failed("디코딩 실패 \(decodeRetries + 1)회: \(lastDecodeError ?? "?")"),
                         durationMs: Int(Date().timeIntervalSince(started) * 1000))
    }

    static let instructions = """
        당신은 사진에서 추출한 텍스트를 읽고 두 후보 중 어느 쪽인지 고릅니다.
        텍스트에 있는 내용만 사용하고, 없는 사실을 만들어내지 마세요.
        날짜·계좌번호·고객번호·결제수단 같은 구체적 단서가 있으면 그것이 근거입니다.
        그런 단서가 하나도 없을 때만 cannotTell 을 고르세요.
        """

    /// Describes each candidate by its discriminator rather than by its
    /// internal name: `bill_invoice` means nothing to the model, but "a future
    /// due date and an account number to pay into" does.
    ///
    /// Today's date is included because several discriminators are "past
    /// versus future" and a language model has no clock. Measured: without it
    /// the model answered cannotTell for a January receipt and a December
    /// due date — which was the CORRECT answer to the question as asked. It
    /// could not tell, because nothing in the prompt said when now was.
    static func prompt(text: String, candidateA: CategoryID, candidateB: CategoryID,
                       today: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = .current
        return """
        오늘은 \(formatter.string(from: today)) 입니다. 날짜가 과거인지 미래인지는
        이 기준으로 판단하세요.

        아래는 사진에서 읽은 텍스트입니다.

        \"\"\"
        \(text)
        \"\"\"

        후보 1: \(describe(candidateA))
        후보 2: \(describe(candidateB))

        어느 쪽입니까?
        """
    }

    /// TODO(prompts): these live in code for now. pipeline.md wants prompts
    /// versioned in prompts/ alongside schema and model identifiers; that move
    /// belongs with the session that adds more arbitration pairs.
    static func describe(_ category: CategoryID) -> String {
        switch category.rawValue {
        case "receipt":
            return "영수증 — 이미 결제가 끝난 기록. 과거 날짜, 결제 수단, 합계."
        case "bill_invoice":
            return "고지서·청구서 — 앞으로 내야 할 돈. 미래의 납부 기한, 입금 계좌번호, 고객번호."
        case "appointment_slip":
            return "예약 확인증 — 병원·기관이 발급. 진료과, 예약 일시, 확인번호."
        case "booking_screenshot":
            return "예약 스크린샷 — 앱이나 웹의 예약 확인 화면. 업체명, 인원수, 확인번호."
        case "device_display":
            return "측정기 화면 — 혈압·혈당·체중계의 숫자 표시. 단위가 붙은 수치."
        case "workout_display":
            return "운동 기록 화면 — 시간·거리·칼로리·운동 종류."
        case "document_general":
            return "일반 문서 — 특정 서식이 없는 글."
        case "warranty_doc":
            return "보증서 — 제품명, 구매일, 보증 기간."
        case "instruction_manual":
            return "설명서 — 번호가 매겨진 단계, 주의사항."
        default:
            return category.rawValue
        }
    }
}
