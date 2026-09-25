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
public struct FoundationModelsArbiter: TextArbiter {
    /// Long OCR output is truncated: the discriminating facts (a date, an
    /// account number, a total) are near the start or end, and the context
    /// window is not free.
    public let maxCharacters: Int

    public init(maxCharacters: Int = 2000) {
        self.maxCharacters = maxCharacters
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
        let session = LanguageModelSession(instructions: Self.instructions)
        let prompt = Self.prompt(text: String(text.prefix(maxCharacters)),
                                 candidateA: candidateA, candidateB: candidateB)

        do {
            let response = try await session.respond(to: prompt, generating: ArbitrationChoice.self)
            let ms = Int(Date().timeIntervalSince(started) * 1000)
            switch response.content {
            case .first:      return ArbitrationOutcome(verdict: .candidateA, declineReason: nil, durationMs: ms)
            case .second:     return ArbitrationOutcome(verdict: .candidateB, declineReason: nil, durationMs: ms)
            case .cannotTell: return ArbitrationOutcome(verdict: .cannotTell, declineReason: nil, durationMs: ms)
            }
        } catch let error as LanguageModelSession.GenerationError {
            let ms = Int(Date().timeIntervalSince(started) * 1000)
            switch error {
            case .guardrailViolation, .refusal:
                // Recorded separately: a refusal says something about our
                // prompt, not about the photo, and it should be visible rather
                // than folded into a generic failure.
                return .declined(.guardrailRefused, durationMs: ms)
            default:
                return .declined(.failed(String(describing: error)), durationMs: ms)
            }
        } catch {
            return .declined(.failed(String(describing: error)),
                             durationMs: Int(Date().timeIntervalSince(started) * 1000))
        }
    }

    static let instructions = """
        당신은 사진에서 추출한 텍스트를 읽고 두 후보 중 어느 쪽인지 고릅니다.
        추측하지 마세요. 텍스트에 근거가 없으면 cannotTell 을 고르세요.
        텍스트에 있는 내용만 사용하고, 없는 사실을 만들어내지 마세요.
        """

    /// Describes each candidate by its discriminator rather than by its
    /// internal name: `bill_invoice` means nothing to the model, but "a future
    /// due date and an account number to pay into" does.
    static func prompt(text: String, candidateA: CategoryID, candidateB: CategoryID) -> String {
        """
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
