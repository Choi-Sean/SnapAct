import Testing
import CoreGraphics
import Foundation
@testable import SnapActKit

@Suite("라우팅")
struct RoutingTests {

    private func config() throws -> RoutingConfig { try RoutingConfig.load() }
    private func classes() throws -> ClassEmbeddings { try ClassEmbeddings.load() }

    private func image(named name: String) throws -> CGImage {
        let url = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()
            .appendingPathComponent("CrossValidation/images").appendingPathComponent(name)
        return try PixelBuffer.downsample(url: url)
    }

    // MARK: - Config

    @Test("설정이 로드되고, 미설정 항목을 스스로 보고한다")
    func configReportsWhatIsUnset() throws {
        let c = try config()
        #expect(c.schemaVersion == RoutingConfig.supportedSchemaVersion)
        // These are meant to be null right now. If someone fills them in with
        // guesses, this test is where that becomes a visible decision.
        #expect(!c.thresholds.isConfigured)
        #expect(!c.unconfigured.isEmpty)
        print("  미설정: \(c.unconfigured.joined(separator: ", "))")
    }

    @Test("사전필터 라벨이 Vision 이 실제로 아는 것들이다")
    func prefilterLabelsExist() throws {
        // A label Vision does not know matches nothing and fails silently,
        // which is the worst way for a filter to be wrong.
        let unknown = ScenePrefilter().unknownLabels(in: try config().prefilter)
        #expect(unknown.isEmpty, "Vision 이 모르는 라벨: \(unknown)")
    }

    @Test("종횡비 범위가 유효하다")
    func aspectRangesAreWellFormed() throws {
        let catalog = try ActionCatalog.load()
        for (category, window) in try config().structuralSignals.aspectRatio.ranges {
            #expect(window.count == 2, "\(category) 범위 원소가 2개가 아닙니다")
            #expect(window[0] < window[1], "\(category) 범위가 뒤집혔습니다")
            #expect(catalog.classes[category] != nil, "\(category) 가 카탈로그에 없습니다")
        }
    }

    @Test("구조 신호 대상 클래스가 전부 실재한다")
    func signalTargetsExist() throws {
        let catalog = try ActionCatalog.load()
        let signals = try config().structuralSignals
        for category in signals.documentEdges.appliesTo + signals.textPresence.appliesTo {
            #expect(catalog.classes[category] != nil, "\(category) 가 카탈로그에 없습니다")
        }
    }

    // MARK: - The unknown decision

    @Test("임계값이 null 이면 클래스를 주장하지 않는다")
    func unconfiguredThresholdsYieldUnknown() throws {
        // Not a placeholder behaviour. Returning the top class here would be
        // an invented threshold of zero, which is exactly what was asked not
        // to happen.
        let thresholds = RoutingConfig.Thresholds(minScore: nil, minMargin: nil)
        let top = ClassSimilarity(category: CategoryID("receipt"), score: 0.9, isNegative: false)
        #expect(CLIPRouter.unknownReason(top: top, margin: 0.5, thresholds: thresholds)
                == .thresholdsNotConfigured)
    }

    @Test("네거티브 클래스가 1위면 임계값과 무관하게 unknown")
    func negativeTopIsAlwaysUnknown() throws {
        let top = ClassSimilarity(category: CategoryID("neg_food"), score: 0.9, isNegative: true)
        for thresholds in [RoutingConfig.Thresholds(minScore: nil, minMargin: nil),
                           RoutingConfig.Thresholds(minScore: 0.1, minMargin: 0.01)] {
            #expect(CLIPRouter.unknownReason(top: top, margin: 0.5, thresholds: thresholds)
                    == .topClassIsNegative(CategoryID("neg_food")))
        }
    }

    @Test("점수와 margin 이 각각 독립적으로 unknown 을 만든다")
    func scoreAndMarginAreSeparateGates() {
        let thresholds = RoutingConfig.Thresholds(minScore: 0.20, minMargin: 0.03)
        let top = ClassSimilarity(category: CategoryID("receipt"), score: 0.25, isNegative: false)

        #expect(CLIPRouter.unknownReason(top: top, margin: 0.05, thresholds: thresholds) == nil)
        // Confident but unable to choose — a different failure from unsure.
        #expect(CLIPRouter.unknownReason(top: top, margin: 0.01, thresholds: thresholds)
                == .marginBelowThreshold(margin: 0.01, threshold: 0.03))

        let weak = ClassSimilarity(category: CategoryID("receipt"), score: 0.15, isNegative: false)
        #expect(CLIPRouter.unknownReason(top: weak, margin: 0.9, thresholds: thresholds)
                == .scoreBelowThreshold(score: 0.15, threshold: 0.20))
    }

    // MARK: - Structural signals

    @Test("null 가중치는 아무것도 바꾸지 않는다")
    func nullWeightsAreInert() throws {
        // Every weight is null today, so routing must be pure CLIP. If a
        // default ever leaks in, the scores move and this catches it.
        let classes = try classes()
        let raw = try classes.similarities(to: classes.embedding(for: CategoryID("receipt"))!)
        let (adjusted, multipliers) = CLIPRouter.applyStructuralSignals(
            to: raw,
            signals: SignalSet(aspectRatio: 0.3, isScreenshot: true,
                               hasDocumentEdges: true, hasText: false),
            config: try config().structuralSignals, classes: classes
        )
        #expect(multipliers.isEmpty)
        #expect(adjusted.map(\.category) == raw.map(\.category))
    }

    @Test("가중치가 설정되면 순위가 실제로 바뀐다")
    func configuredWeightsReorder() throws {
        // Proves the reweighting path works at all, which the null-weight test
        // above cannot: it passes equally well if the code does nothing.
        let classes = try classes()
        let base = [
            ClassSimilarity(category: CategoryID("receipt"), score: 0.20, isNegative: false),
            ClassSimilarity(category: CategoryID("business_card"), score: 0.21, isNegative: false),
        ]
        let json = """
        {"aspectRatio": {"boost": 1.5, "penalty": null,
          "ranges": {"receipt": [0.15, 0.55]}},
         "screenshot": {"boost": null},
         "documentEdges": {"boost": null, "appliesTo": []},
         "textPresence": {"penaltyWhenAbsent": null, "appliesTo": []}}
        """
        let signals = try JSONDecoder().decode(
            RoutingConfig.StructuralSignals.self, from: Data(json.utf8))

        let (adjusted, multipliers) = CLIPRouter.applyStructuralSignals(
            to: base, signals: SignalSet(aspectRatio: 0.3),
            config: signals, classes: classes
        )
        #expect(multipliers[CategoryID("receipt")] == 1.5)
        #expect(adjusted.first?.category == CategoryID("receipt"),
                "가중치 적용 후에도 순위가 그대로입니다")
    }

    // MARK: - End to end

    @Test("실제 이미지로 라우팅이 끝까지 돈다")
    func routesEndToEnd() async throws {
        let router = CLIPRouter(embedder: MobileCLIPEncoder(),
                                classes: try classes(), config: try config())
        let result = try await router.route(try image(named: "receipt_tall.png"),
                                            signals: SignalSet(aspectRatio: 0.3))
        #expect(result.source == .clip)
        // Thresholds are null, so it must decline rather than guess.
        #expect(result.isUnknown)
        #expect(result.unknownReason == .thresholdsNotConfigured
                || { if case .topClassIsNegative = result.unknownReason { return true }
                     return false }())
        // The ranking is still carried — that is what makes the debug screen
        // useful while the answer is unknown.
        #expect(result.alternates.count == 45)
        print("  receipt_tall.png -> \(result.category) (top \(result.alternates[0].category)"
              + " \(String(format: "%.4f", result.score)), margin \(String(format: "%.4f", result.margin)))")
    }

    @Test("KNN 라우터는 스텁이며 조용히 실패하지 않는다")
    func knnStubThrows() async throws {
        await #expect(throws: (any Error).self) {
            _ = try await KNNRouter().route(try image(named: "square.png"),
                                            signals: SignalSet(aspectRatio: 1.0))
        }
    }
}
