import Testing
import Foundation
@testable import SnapActKit

@Suite("랭킹")
struct RankingTests {

    private func config() throws -> RankingConfig { try RankingConfig.load() }
    private func catalog() throws -> ActionCatalog { try ActionCatalog.load() }

    /// Deterministic, so exploration can be tested rather than hoped at.
    struct SeededGenerator: RandomNumberGenerator, Sendable {
        var state: UInt64
        init(seed: UInt64) { state = seed &* 6364136223846793005 &+ 1442695040888963407 }
        mutating func next() -> UInt64 {
            state ^= state << 13; state ^= state >> 7; state ^= state << 17
            return state
        }
    }

    private var defaultContext: ActionContext {
        ActionContext(hourBucket: .afternoon, isWeekend: false, captureDelay: .recent)
    }

    // MARK: - Config

    @Test("설정이 로드되고 미설정 가중치를 보고한다")
    func configLoads() throws {
        let c = try config()
        #expect(c.smoothing.alpha == 8.0)
        #expect(c.exploration.probability == 0.10)
        #expect(!c.unconfiguredBoosts.isEmpty)
    }

    @Test("전제조건·폴백의 동사가 전부 어휘에 있다")
    func configVerbsExist() throws {
        let catalog = try catalog()
        let c = try config()
        for verb in c.preconditions.keys { #expect(catalog[verb] != nil, "\(verb)") }
        for (from, to) in c.permissionFallbacks {
            #expect(catalog[from] != nil, "\(from)")
            #expect(catalog[to] != nil, "\(to)")
        }
        for rule in c.contextBoosts.values.map(\.verbs) + c.profileBoosts.values.map(\.verbs) {
            for verb in rule { #expect(catalog[verb] != nil, "\(verb)") }
        }
    }

    // MARK: - Smoothing

    @Test("카운터가 비어 있으면 점수가 basePrior 와 같다")
    func emptyCountersEqualBasePrior() throws {
        // First-time users must get the spreadsheet's intended order, not an
        // arbitrary one.
        let ranker = BayesianRanker(config: try config(), store: InMemoryCounterStore())
        for prior in [0.70, 0.45, 0.35, 0.20] {
            #expect(abs(ranker.smoothedRate(ActionCounter(), basePrior: prior) - prior) < 1e-9)
        }
    }

    @Test("같은 선택을 반복하면 기본 순서를 몇 회에 뒤집는가")
    func measuresWhenRepetitionOverturnsDefault() throws {
        // The spreadsheet says three consecutive picks should move an action to
        // the top. This measures what the configured alpha actually does rather
        // than asserting the claim.
        let c = try config()
        let store = InMemoryCounterStore()
        let ranker = BayesianRanker(config: c, store: store)

        func flipPoint(secondaryPrior: Double) -> Int? {
            var primary = ActionCounter(), secondary = ActionCounter()
            for n in 1 ... 12 {
                primary.impressions = n; secondary.impressions = n; secondary.clicks = n
                if ranker.smoothedRate(secondary, basePrior: secondaryPrior)
                    > ranker.smoothedRate(primary, basePrior: 0.70) { return n }
            }
            return nil
        }

        let first = flipPoint(secondaryPrior: 0.45)
        let rest = flipPoint(secondaryPrior: 0.35)
        print("  alpha=\(c.smoothing.alpha): 부 첫째(0.45) \(first.map(String.init) ?? "없음")회, "
              + "부 나머지(0.35) \(rest.map(String.init) ?? "없음")회에 역전")

        // Both must eventually flip — a personalisation that can never
        // overturn the default is not personalisation.
        #expect(first != nil && rest != nil)
        // The spreadsheet's rule, enforced for BOTH secondary priors. This is
        // what alpha was chosen to satisfy, so it is asserted rather than
        // merely reported — raising alpha to 10 fails this.
        #expect(first! == 3, "부 첫째가 \(first!)회 — 엑셀은 3회를 요구합니다")
        #expect(rest! == 3, "부 나머지가 \(rest!)회 — 엑셀은 3회를 요구합니다")
    }

    @Test("노출만 되고 안 눌리면 점수가 내려간다")
    func impressionsWithoutClicksDecay() throws {
        let ranker = BayesianRanker(config: try config(), store: InMemoryCounterStore())
        let fresh = ranker.smoothedRate(ActionCounter(), basePrior: 0.70)
        let ignored = ranker.smoothedRate(ActionCounter(impressions: 20, clicks: 0), basePrior: 0.70)
        #expect(ignored < fresh, "20번 보여주고 한 번도 안 눌렸는데 점수가 그대로입니다")
    }

    // MARK: - Candidate generation

    @Test("유니버설 액션은 unknown 에서도 항상 나온다")
    func universalAlwaysPresent() throws {
        // This is why an empty class action list is never an empty screen.
        let generator = CandidateGenerator(catalog: try catalog(), config: try config())
        let candidates = generator.candidates(for: .unknown, text: "무언가 텍스트")
        #expect(!candidates.isEmpty)
        #expect(candidates.contains { $0.origin == .universal })
    }

    @Test("전제 미충족 동사는 후보에서 빠진다")
    func preconditionsExclude() throws {
        let generator = CandidateGenerator(catalog: try catalog(), config: try config())
        let withoutSSID = generator.candidates(for: CategoryID("wifi_credentials"),
                                               text: "그냥 아무 글자")
        #expect(!withoutSSID.contains { $0.verb == VerbID("connect_wifi") })

        let withSSID = generator.candidates(for: CategoryID("wifi_credentials"),
                                            text: "SSID: CafeWiFi 비밀번호 abcd1234")
        #expect(withSSID.contains { $0.verb == VerbID("connect_wifi") })
    }

    @Test("Tier 0 클래스에서 외부 전송 동사가 제거된다")
    func tierZeroDropsEgress() throws {
        let generator = CandidateGenerator(catalog: try catalog(), config: try config())
        let candidates = generator.candidates(for: CategoryID("medication"),
                                              text: "아목시실린 500mg 1일 3회")
        let verbs = Set(candidates.map(\.verb))
        #expect(verbs.intersection(ActionCatalog.networkEgressVerbs).isEmpty,
                "Tier 0 인데 \(verbs.intersection(ActionCatalog.networkEgressVerbs)) 가 남았습니다")
        // Universal actions include search and translate, so this proves the
        // filter runs after the merge rather than before.
        #expect(!verbs.contains(VerbID("search")))
    }

    @Test("권한이 거부되면 버튼이 사라지지 않고 폴백으로 바뀐다")
    func deniedPermissionSubstitutes() throws {
        // A missing button looks like a broken app; a changed one keeps the
        // intent reachable.
        let generator = CandidateGenerator(catalog: try catalog(), config: try config())
        let candidates = generator.candidates(for: CategoryID("business_card"),
                                              text: "ACME 010-1234-5678",
                                              deniedPermissions: [VerbID("create_contact")])
        #expect(!candidates.contains { $0.verb == VerbID("create_contact") })
        #expect(candidates.contains { $0.verb == VerbID("export_file") })
        #expect(!candidates.isEmpty)
    }

    @Test("정정된 카테고리의 액션이 기존 것에 더해진다")
    func correctionAddsActions() throws {
        let generator = CandidateGenerator(catalog: try catalog(), config: try config())
        let plain = generator.candidates(for: CategoryID("receipt"), text: "합계 12,500원")
        let corrected = generator.candidates(for: CategoryID("receipt"),
                                             correctedTo: [CategoryID("bill_invoice")],
                                             text: "합계 12,500원 납부기한")
        #expect(corrected.count >= plain.count)
        #expect(corrected.contains { $0.origin == .corrected })
        // Everything that was there before is still there.
        for candidate in plain {
            #expect(corrected.contains { $0.verb == candidate.verb },
                    "\(candidate.verb) 가 사라졌습니다")
        }
    }

    // MARK: - Ranking and exploration

    @Test("랭킹은 순서만 바꾸고 후보를 버리지 않는다")
    func rankingNeverDrops() throws {
        let generator = CandidateGenerator(catalog: try catalog(), config: try config())
        let candidates = generator.candidates(for: CategoryID("business_card"),
                                              text: "ACME 010-1234-5678")
        let ranker = BayesianRanker(config: try config(), store: InMemoryCounterStore())
        let outcome = ranker.rank(candidates, category: CategoryID("business_card"),
                                  context: defaultContext,
                                  randomness: SeededGenerator(seed: 1))
        #expect(Set(outcome.actions.map(\.verb)) == Set(candidates.map(\.verb)))
    }

    @Test("탐색이 실제로 하위 후보를 끌어올린다")
    func explorationPromotes() throws {
        // Without this, ranks four and below are never shown, never clicked,
        // and the counters confirm the initial order forever.
        let c = try config()
        let generator = CandidateGenerator(catalog: try catalog(), config: c)
        let candidates = generator.candidates(for: CategoryID("receipt"),
                                              text: "합계 12,500원 2026-01-05")
        #expect(candidates.count > c.exploration.topK, "후보가 적어 탐색을 시험할 수 없습니다")

        let ranker = BayesianRanker(config: c, store: InMemoryCounterStore())
        var applied = 0
        var promotedFromBelowTopK = 0
        for seed in UInt64(1) ... 400 {
            let outcome = ranker.rank(candidates, category: CategoryID("receipt"),
                                      context: defaultContext,
                                      randomness: SeededGenerator(seed: seed))
            if outcome.explorationApplied {
                applied += 1
                let promoted = try #require(outcome.promoted)
                let natural = try #require(outcome.actions.first { $0.verb == promoted }).naturalRank
                if natural > c.exploration.topK { promotedFromBelowTopK += 1 }
            }
        }
        let rate = Double(applied) / 400.0
        print("  탐색 발동률 \(String(format: "%.1f%%", rate * 100)) (설정 \(c.exploration.probability * 100)%), "
              + "하위에서 승격 \(promotedFromBelowTopK)/\(applied)")
        #expect(applied > 0, "400회 중 한 번도 탐색이 일어나지 않았습니다")
        #expect(abs(rate - c.exploration.probability) < 0.06)
        #expect(promotedFromBelowTopK == applied, "상위권 안에서만 섞였습니다 — 학습 효과가 없습니다")
    }

    @Test("탐색해도 후보가 사라지지 않는다")
    func explorationKeepsEverything() throws {
        let c = try config()
        let generator = CandidateGenerator(catalog: try catalog(), config: c)
        let candidates = generator.candidates(for: CategoryID("receipt"), text: "합계 12,500원")
        let ranker = BayesianRanker(config: c, store: InMemoryCounterStore())
        for seed in UInt64(1) ... 50 {
            let outcome = ranker.rank(candidates, category: CategoryID("receipt"),
                                      context: defaultContext,
                                      randomness: SeededGenerator(seed: seed))
            #expect(outcome.actions.count == candidates.count)
        }
    }

    @Test("null 가중치는 점수를 바꾸지 않는다")
    func nullBoostsAreInert() throws {
        let ranker = BayesianRanker(config: try config(), store: InMemoryCounterStore())
        let context = ActionContext(hourBucket: .evening, isWeekend: true,
                                    captureDelay: .justNow, isScreenshot: true,
                                    profile: ["expense", "travel"])
        for verb in [VerbID("export_file"), VerbID("split_bill"), VerbID("create_event")] {
            #expect(ranker.contextBoost(for: verb, context: context) == 1.0)
            #expect(ranker.profileBoost(for: verb, context: context) == 1.0)
        }
    }

    // MARK: - Counters

    @Test("카운터가 기록되고 리셋된다")
    func countersRecordAndReset() throws {
        let store = InMemoryCounterStore()
        let category = CategoryID("receipt")
        store.recordImpressions(category: category, verbs: [VerbID("save_note"), VerbID("split_bill")])
        store.recordClick(category: category, verb: VerbID("split_bill"))

        #expect(store.counter(category: category, verb: VerbID("save_note"))
                == ActionCounter(impressions: 1, clicks: 0))
        #expect(store.counter(category: category, verb: VerbID("split_bill"))
                == ActionCounter(impressions: 1, clicks: 1))

        store.reset()
        #expect(store.allCounters.isEmpty)
    }

    @Test("공유 컨테이너를 못 쓰면 알리되, 그래도 동작은 한다")
    func sharedStoreReportsFallbackButStillWorks() {
        // A test binary carries no entitlements, so this is always the
        // fallback path here — which is the point. Falling back silently would
        // mean the extension cannot see the history, and the symptom would be
        // "personalisation forgets whatever was shared from the share sheet".
        let store = SharedCounterStore(suiteName: "group.snapact.definitely.not.configured")
        #expect(store.isSharedContainer == false)

        // Reporting the fallback must not mean refusing to work.
        let category = CategoryID("__test_fallback__")
        store.reset()
        store.recordImpressions(category: category, verbs: [VerbID("save_note")])
        store.recordClick(category: category, verb: VerbID("save_note"))
        #expect(store.counter(category: category, verb: VerbID("save_note"))
                == ActionCounter(impressions: 1, clicks: 1))
        store.reset()
        #expect(store.counter(category: category, verb: VerbID("save_note")) == ActionCounter())
    }
}
