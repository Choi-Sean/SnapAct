import Testing
import Foundation
@testable import SnapActKit

/// The catalog is generated, so these do not re-test the generator's parsing.
/// They assert that what actually shipped in the bundle still holds the
/// decisions the review made — the kind of thing a later spreadsheet edit can
/// quietly undo.
@Suite("ActionCatalog")
struct ActionCatalogTests {

    private func catalog() throws -> ActionCatalog { try ActionCatalog.load() }

    /// Skips the integrity pass so a single-invariant test reports on its own
    /// invariant. Without this, one unrelated break makes every test in the
    /// suite fail with the same message and none of them prove anything.
    private func unvalidated() throws -> ActionCatalog {
        try ActionCatalog.load(validating: false)
    }

    @Test("번들에서 로드되고 검증을 통과한다")
    func loads() throws {
        let c = try catalog()
        #expect(c.schemaVersion == ActionCatalog.supportedSchemaVersion)
        // Floors, not exact counts: the spreadsheet is expected to grow, but a
        // partial decode would collapse these.
        #expect(c.classes.count > 30)
        #expect(c.verbs.count > 15)
        #expect(c.blockingClasses.count == 4)
        #expect(!c.rankingSignals.isEmpty)
        #expect(!c.sourceSha256.isEmpty)
    }

    @Test("모든 클래스가 주 액션을 가진다")
    func everyClassHasPrimary() throws {
        let missing = try unvalidated().classes
            .filter { $0.value.primary.isEmpty }
            .keys.map(\.rawValue).sorted()
        #expect(missing.isEmpty, "주 액션 없는 클래스: \(missing)")
    }

    @Test("참조 무결성 — 쓰이는 동사는 전부 어휘에 있다")
    func referentialIntegrity() throws {
        // validate() throws on a violation, so reaching here is the assertion.
        try catalog().validate()
    }

    @Test("Tier 0 클래스에 외부 전송 동사가 없다")
    func tierZeroHasNoEgress() throws {
        let c = try unvalidated()
        for (category, photoClass) in c.classes where photoClass.tier == .zero {
            let verbs = Set((photoClass.primary + photoClass.secondary).map(\.verb))
            let egress = verbs.intersection(ActionCatalog.networkEgressVerbs)
            #expect(egress.isEmpty, "\(category) 에 외부 전송 동사 \(egress)")
        }
    }

    // MARK: - Review decisions that a spreadsheet edit could silently undo

    @Test("캡션 동사는 존재하지 않는다 — PhotoKit 에 쓰기 API 가 없다")
    func noCaptionVerb() throws {
        // Photos captions cannot be written by a third-party app. A verb named
        // for it would ship a button that can never work; save_note linked by
        // PHAsset.localIdentifier is the substitute.
        let suspicious = try unvalidated().verbs.keys
            .filter { $0.rawValue.contains("caption") }
            .map(\.rawValue)
        #expect(suspicious.isEmpty, "캡션 동사가 생겼습니다: \(suspicious)")
    }

    @Test("health 그룹은 묶이되 병합되지 않는다 — tier 가 서로 다르다")
    func healthGroupKeepsDistinctTiers() throws {
        let c = try unvalidated()
        let members = c.categories(inGroup: "health")
        #expect(members.count == 3, "health 그룹: \(members.map(\.rawValue))")
        let tiers = Set(members.compactMap { c[$0]?.tier })
        #expect(tiers.count > 1, "tier 가 하나로 합쳐졌습니다 — 병합하지 않기로 한 결정이 깨졌습니다")
    }

    @Test("payment_screenshot 은 receipt 액션을 상속하고 마스킹 규칙을 유지한다")
    func paymentScreenshotAliasesReceipt() throws {
        let c = try unvalidated()
        let payment = try #require(c[CategoryID("payment_screenshot")])
        let receipt = try #require(c[CategoryID("receipt")])
        #expect(payment.aliasOf == CategoryID("receipt"))
        #expect(payment.primary.map(\.verb) == receipt.primary.map(\.verb))
        #expect(payment.maskingRules.contains("account_number"))
    }

    @Test("chat_screenshot 은 대화 원문을 보관하지 않는다")
    func chatScreenshotDoesNotRetainRawText() throws {
        let chat = try #require(try unvalidated()[CategoryID("chat_screenshot")])
        #expect(chat.retainsRawText == false)
        #expect(chat.primary.map(\.verb) == [VerbID("create_event")])
    }

    @Test("appointment_slip 은 스크린샷일 때 booking_screenshot 을 함께 제시한다")
    func appointmentSlipCoPresents() throws {
        let slip = try #require(try unvalidated()[CategoryID("appointment_slip")])
        #expect(slip.coPresentWhenScreenshot.contains(CategoryID("booking_screenshot")))
    }

    @Test("llm 으로 풀 클래스가 지정돼 있다")
    func llmResolutionMarked() throws {
        let llm = try unvalidated().classes
            .filter { $0.value.resolution == .llm }
            .keys.map(\.rawValue).sorted()
        #expect(llm.contains("error_screen"))
        #expect(llm.contains("chat_screenshot"))
        #expect(llm.count >= 5, "llm 클래스: \(llm)")
    }

    @Test("유니버설 액션은 항상 있고 모두 유효한 동사다")
    func universalActionsExist() throws {
        let c = try catalog()
        #expect(!c.universalActions.isEmpty)
        for action in c.universalActions {
            #expect(c[action.verb] != nil, "유니버설 동사 \(action.verb) 가 어휘에 없습니다")
            #expect(action.baseScore == c.baseScores.universal)
        }
    }

    @Test("되돌릴 수 없는 동사는 자동 실행되지 않는다")
    func irreversibleVerbsAreNotAutomatic() throws {
        // Confirmation fatigue is answered by undo. A verb that cannot be
        // undone therefore must not sit at `auto` — except show_detail, which
        // calls no API and changes nothing outside the screen.
        let exempt: Set<VerbID> = [VerbID("show_detail")]
        for (id, verb) in try catalog().verbs
        where !verb.undoable && verb.confirmation == .auto && !exempt.contains(id) {
            // Read-only verbs legitimately live here; flag only the ones that act.
            #expect(verb.api.contains("앱 내") || verb.api.contains("웹") ||
                    verb.api.contains("UIPasteboard") || verb.api.contains("MapKit") ||
                    verb.api.contains("UIApplication") || verb.api.contains("Translation") ||
                    verb.api.contains("공유 시트"),
                    "\(id) 는 되돌릴 수 없는데 확인 등급이 auto 입니다 (api=\(verb.api))")
        }
    }
}
