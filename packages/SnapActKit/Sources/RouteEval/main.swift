import CoreGraphics
import Foundation
import SnapActKit

/// Runs the real routing path over a labelled photo directory and dumps one
/// row per photo.
///
/// Uses CLIPRouter with the bundled configs rather than reimplementing the
/// scoring, so what gets measured is what ships — including the prefilter
/// running before CLIP, which a separate Python evaluation cannot see. The
/// earlier threshold evidence came from two independent measurements whose
/// combined effect had to be guessed at; this measures the composition.
///
///     swift run -c release RouteEval <데이터 루트> [--min-confidence 0.7]
///
/// Layout: <루트>/<split>/<라벨>/*.jpg
///
/// Output is TSV on stdout: label, file, source, category, score, margin,
/// prefilterLabel. Thresholds are deliberately NOT applied — the sweep
/// happens afterwards over these rows, so one pass serves every candidate
/// value.
let arguments = Array(CommandLine.arguments.dropFirst())
guard let rootPath = arguments.first else {
    FileHandle.standardError.write(Data("사용법: RouteEval <데이터 루트> [--min-confidence N]\n".utf8))
    exit(2)
}
var minConfidence: Double?
if let index = arguments.firstIndex(of: "--min-confidence"), index + 1 < arguments.count {
    minConfidence = Double(arguments[index + 1])
}

let root = URL(fileURLWithPath: rootPath)
let suffixes: Set<String> = ["jpg", "jpeg", "png", "webp", "heic"]

let embeddings = try ClassEmbeddings.load()
let baseConfig = try RoutingConfig.load()
let encoder = MobileCLIPEncoder()
let extractor = SignalExtractor()

// Override only the prefilter confidence, so a sweep over it does not need
// the file edited between runs.
let config: RoutingConfig
if let minConfidence {
    let json = """
    {"schemaVersion": 1,
     "thresholds": {"minScore": null, "minMargin": null},
     "prefilter": {"enabled": true, "minConfidence": \(minConfidence),
                   "rejectLabels": \(try String(decoding: JSONEncoder().encode(baseConfig.prefilter.rejectLabels), as: UTF8.self))},
     "structuralSignals": {
       "aspectRatio": {"boost": null, "penalty": null, "ranges": {}},
       "screenshot": {"boost": null},
       "documentEdges": {"boost": null, "appliesTo": []},
       "textPresence": {"penaltyWhenAbsent": null, "appliesTo": []}}}
    """
    config = try JSONDecoder().decode(RoutingConfig.self, from: Data(json.utf8))
} else {
    config = baseConfig
}

let router = CLIPRouter(embedder: encoder, classes: embeddings, config: config)

print("label\tfile\tsource\tcategory\tscore\tmargin\treason")
for split in ["train", "test"] {
    let splitURL = root.appendingPathComponent(split)
    guard let classDirs = try? FileManager.default.contentsOfDirectory(
        at: splitURL, includingPropertiesForKeys: nil) else { continue }
    for classDir in classDirs.sorted(by: { $0.path < $1.path }) {
        let label = classDir.lastPathComponent
        guard let files = try? FileManager.default.contentsOfDirectory(
            at: classDir, includingPropertiesForKeys: nil) else { continue }
        for file in files.sorted(by: { $0.path < $1.path })
        where suffixes.contains(file.pathExtension.lowercased()) {
            guard let image = try? PixelBuffer.downsample(url: file) else { continue }
            let signals = await extractor.signals(for: image, sourceURL: file)
            guard let result = try? await router.route(image, signals: signals) else { continue }
            let reason = result.unknownReason.map { String(describing: $0) } ?? "-"
            print([label, file.lastPathComponent, result.source.rawValue,
                   result.category.rawValue, String(format: "%.6f", result.score),
                   String(format: "%.6f", result.margin), reason].joined(separator: "\t"))
        }
    }
}
