import Foundation
import SnapActKit

/// Reproduces the condition that deadlocked the test suite: many concurrent
/// routes, each hitting the prefilter's blocking Vision call.
///
/// Before VisionWork this hung with every cooperative thread parked in
/// VNControlledCapacityTasksQueue.dispatchGroupWait. A hang is not a test
/// failure — it is a hang — so this prints progress and the caller enforces a
/// timeout.
let concurrency = Int(CommandLine.arguments.dropFirst().first ?? "16") ?? 16
let images = ["card_landscape.png", "receipt_tall.png", "screenshot.png", "square.png", "wide.png"]
let base = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
    .appendingPathComponent("CrossValidation/images")

let embeddings = try ClassEmbeddings.load()
let config = try RoutingConfig.load()
print("prefilter minConfidence = \(String(describing: config.prefilter.minConfidence))")
guard config.prefilter.enabled, config.prefilter.isConfigured else {
    print("사전필터가 꺼져 있어 교착 조건을 재현할 수 없습니다"); exit(1)
}

let router = CLIPRouter(embedder: MobileCLIPEncoder(), classes: embeddings, config: config)
let extractor = SignalExtractor()
let started = Date()
var done = 0

await withTaskGroup(of: String.self) { group in
    for index in 0 ..< concurrency {
        let url = base.appendingPathComponent(images[index % images.count])
        group.addTask {
            guard let image = try? PixelBuffer.downsample(url: url) else { return "load-failed" }
            let signals = await extractor.signals(for: image, sourceURL: url)
            guard let result = try? await router.route(image, signals: signals) else { return "route-failed" }
            return "\(result.source.rawValue)/\(result.category)"
        }
    }
    for await _ in group { done += 1 }
}

let ms = Int(Date().timeIntervalSince(started) * 1000)
print("동시 \(concurrency)개 완료: \(done)/\(concurrency)  \(ms)ms")
exit(done == concurrency ? 0 : 1)
