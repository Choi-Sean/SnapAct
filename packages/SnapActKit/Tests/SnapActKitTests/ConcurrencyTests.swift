import Testing
import CoreGraphics
import Foundation
@testable import SnapActKit

/// Exercises the concurrent path that the prefilter deadlock lived on.
///
/// **These tests cannot detect that deadlock, and the attempt to make them is
/// instructive.** The in-process timeout below is itself a Task, so when the
/// cooperative pool is exhausted it never runs — measured: reverting one
/// VisionWork.run call left `swift test` hung at 0% CPU for minutes with both
/// the work and its own watchdog parked. swift-testing's .timeLimit did not
/// fire either.
///
/// Nothing inside the process can rescue a starved pool. The actual guard is
/// `make deadlock-check`, which runs the DeadlockProbe executable under an
/// external timeout — verified to catch the reverted fix in 20s.
///
/// What these DO cover: that the concurrent path completes and returns results
/// for every task when the Vision work is correctly off-pool.
@Suite("동시성")
struct ConcurrencyTests {

    private func imageURL(_ name: String) -> URL {
        URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()
            .appendingPathComponent("CrossValidation/images").appendingPathComponent(name)
    }

    /// Runs `work` and fails rather than hangs if it does not finish.
    private func withTimeout(seconds: Double, _ work: @escaping @Sendable () async -> Int) async -> Int? {
        await withTaskGroup(of: Int?.self) { group in
            group.addTask { await work() }
            group.addTask {
                try? await Task.sleep(for: .seconds(seconds))
                return nil
            }
            let first = await group.next() ?? nil
            group.cancelAll()
            return first
        }
    }

    @Test("동시 라우팅이 모든 태스크에 결과를 돌려준다", .timeLimit(.minutes(1)))
    func concurrentRoutingDoesNotDeadlock() async throws {
        let config = try RoutingConfig.load()
        // The deadlock needed the prefilter to actually run. If it is off this
        // test proves nothing, so say so instead of passing quietly.
        try #require(config.prefilter.enabled && config.prefilter.isConfigured,
                     "사전필터가 꺼져 있어 교착 조건을 재현하지 않습니다")

        let router = CLIPRouter(embedder: MobileCLIPEncoder(),
                                classes: try ClassEmbeddings.load(), config: config)
        let extractor = SignalExtractor()
        let names = ["card_landscape.png", "receipt_tall.png", "screenshot.png",
                     "square.png", "wide.png"]
        // More tasks than the machine has cores, which is what exhausts the
        // pool. Measured before the fix: 16 hung indefinitely.
        let concurrency = max(16, ProcessInfo.processInfo.activeProcessorCount * 2)
        let urls = (0 ..< concurrency).map { imageURL(names[$0 % names.count]) }

        let completed = await withTimeout(seconds: 45) {
            await withTaskGroup(of: Bool.self) { group in
                for url in urls {
                    group.addTask {
                        guard let image = try? PixelBuffer.downsample(url: url) else { return false }
                        let signals = await extractor.signals(for: image, sourceURL: url)
                        return (try? await router.route(image, signals: signals)) != nil
                    }
                }
                var done = 0
                for await ok in group where ok { done += 1 }
                return done
            }
        }

        let message: Comment = """
            동시 \(concurrency)개가 45초 안에 끝나지 않았습니다 — Vision 호출이             협력 스레드를 막고 있습니다 (VisionWork 참고)
            """
        let finished = try #require(completed, message)
        #expect(finished == concurrency)
        print("  동시 \(concurrency)개 라우팅 완료")
    }

    @Test("동시 OCR 이 모든 태스크에 결과를 돌려준다", .timeLimit(.minutes(1)))
    func concurrentOCRDoesNotDeadlock() async throws {
        // Same hazard, different Vision request: recognition and the text
        // detector both block.
        let reader = TextReader(spec: try OCRSpec.load())
        let concurrency = max(16, ProcessInfo.processInfo.activeProcessorCount * 2)
        let url = imageURL("receipt_tall.png")

        let completed = await withTimeout(seconds: 45) {
            await withTaskGroup(of: Bool.self) { group in
                for _ in 0 ..< concurrency {
                    group.addTask {
                        guard let image = try? PixelBuffer.downsample(url: url) else { return false }
                        return (try? await reader.read(image, category: CategoryID("receipt"),
                                                       preferredLanguages: ["en-US"])) != nil
                    }
                }
                var done = 0
                for await ok in group where ok { done += 1 }
                return done
            }
        }
        let finished = try #require(completed, "동시 OCR \(concurrency)개가 45초 안에 끝나지 않았습니다")
        #expect(finished == concurrency)
    }
}
