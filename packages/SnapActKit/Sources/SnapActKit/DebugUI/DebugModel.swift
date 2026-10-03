import CoreGraphics
import Foundation
import ImageIO
import Observation

/// State behind the debug screen.
///
/// Everything here is a projection of what the pipeline already returns — the
/// screen adds no analysis of its own, so what is reviewed is what ships.
@MainActor
@Observable
public final class DebugModel {
    public struct Row: Identifiable, Sendable {
        public let id = UUID()
        public let url: URL
        public var outcome: PhotoPipeline.Outcome?
        public var error: String?
        public var fileName: String { url.lastPathComponent }
    }

    public private(set) var rows: [Row] = []
    public private(set) var selected: Row.ID?
    public private(set) var isBusy = false
    public private(set) var status = "사진을 끌어다 놓으세요."

    public private(set) var memoryBefore: UInt64?
    public private(set) var memoryAfter: UInt64?
    public private(set) var modelLoadMs: Int?
    public private(set) var computeDevices: MobileCLIPEncoder.ComputeDeviceSummary?
    public private(set) var logCount = 0

    private let encoder = MobileCLIPEncoder()
    private let counters: any ActionCounterStore
    private let logs: any InteractionLogStore
    private var pipeline: PhotoPipeline?

    public init(counters: (any ActionCounterStore)? = nil,
                logs: (any InteractionLogStore)? = nil) {
        self.counters = counters ?? InMemoryCounterStore()
        self.logs = logs ?? InMemoryLogStore()
    }

    public var current: Row? { rows.first { $0.id == selected } }

    public func select(_ id: Row.ID) { selected = id }

    /// The catalog entry behind a routed category, so the screen can show the
    /// review verdict that produced its priors.
    public func photoClass(for category: CategoryID) -> ActionCatalog.PhotoClass? {
        pipeline?.catalog[category]
    }

    /// Whichever configuration values are still null, named — so "why is
    /// everything unknown" is answered on screen instead of by reading JSON.
    public var unconfigured: [String] {
        ((try? RoutingConfig.load())?.unconfigured ?? [])
            + ((try? RankingConfig.load())?.unconfiguredBoosts ?? [])
    }

    public func add(_ urls: [URL]) {
        rows.append(contentsOf: urls.map { Row(url: $0) })
        if selected == nil { selected = rows.first?.id }
        Task { await run() }
    }

    public func clearPhotos() {
        rows.removeAll()
        selected = nil
        status = "사진을 끌어다 놓으세요."
    }

    public func resetCounters() {
        counters.reset()
        status = "카운터를 리셋했습니다. 다시 분석하면 점수가 basePrior 로 돌아갑니다."
    }

    public func clearLogs() {
        try? logs.clear()
        logCount = 0
        status = "로그를 비웠습니다."
    }

    public func exportJSONL() -> Data { (try? logs.exportJSONL()) ?? Data() }

    /// Records a tap. Only the counter and the log change — no action is
    /// performed. Executing them is a later session.
    public func choose(_ verb: VerbID, in row: Row) {
        guard let pipeline, let outcome = row.outcome else { return }
        pipeline.recordClick(outcome, verb: verb)
        try? logs.append(pipeline.log(outcome, embedding: nil, chosen: verb,
                                      computeDevices: computeDevices))
        logCount += 1
        status = "\(verb) 기록됨 — 실행은 하지 않습니다 (이번 범위 밖)."
        Task { await rerankCurrent() }
    }

    private func preparePipeline() throws -> PhotoPipeline {
        if let pipeline { return pipeline }
        let built = try PhotoPipeline.bundled(embedder: encoder,
                                              arbiter: FoundationModelsArbiter(),
                                              counters: counters)
        pipeline = built
        return built
    }

    private func run() async {
        guard !isBusy else { return }
        isBusy = true
        defer { isBusy = false }

        let pipeline: PhotoPipeline
        do { pipeline = try preparePipeline() } catch {
            status = "파이프라인 구성 실패: \(error)"
            return
        }

        for index in rows.indices where rows[index].outcome == nil && rows[index].error == nil {
            let url = rows[index].url
            status = "분석 중: \(url.lastPathComponent)"
            do {
                let image = try PixelBuffer.downsample(url: url)
                // Fast path first, exactly as the app will: buttons before OCR.
                var outcome = try await pipeline.analyze(image, sourceURL: url)
                rows[index].outcome = outcome
                pipeline.recordImpressions(outcome)

                outcome = try await pipeline.refine(outcome, image: image)
                rows[index].outcome = outcome

                memoryBefore = encoder.loadFootprint?.before
                memoryAfter = encoder.loadFootprint?.after
                modelLoadMs = encoder.loadDuration.map { Int($0 * 1000) }
            } catch {
                rows[index].error = String(describing: error)
            }
        }

        if computeDevices == nil {
            computeDevices = try? await encoder.computeDeviceSummary()
        }
        status = "완료 — \(rows.count)장"
    }

    /// After a tap, the counters changed, so the order should visibly change.
    private func rerankCurrent() async {
        guard let pipeline, let index = rows.firstIndex(where: { $0.id == selected }),
              let outcome = rows[index].outcome else { return }
        guard let image = try? PixelBuffer.downsample(url: rows[index].url) else { return }
        if let refreshed = try? await pipeline.refine(outcome, image: image) {
            rows[index].outcome = refreshed
        }
    }
}
