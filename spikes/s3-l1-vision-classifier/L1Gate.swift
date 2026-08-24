// The L1 decision layer: turns raw classifier probabilities into a FAIL-CLOSED
// BLOCK / ROUTE decision (CLAUDE.md non-negotiable #2). This is the policy that
// makes the Tier 0 guarantee real -- the model only scores, the gate decides.
//
// Rules (fail-closed):
//   1. argmax is a blocking class            -> BLOCK
//   2. ANY blocking class > suspicionThresh  -> BLOCK  (uncertainty near Tier 0 = block)
//   3. top routing prob < routeThreshold      -> ROUTE("unknown")  (primary path, pipeline.md)
//   4. otherwise                              -> ROUTE(top class)
//
// Usage:  swift L1Gate.swift [L1Classifier.mlmodel] [data/test]
// Runs the gate over a folder of labeled images and reports whether ANY Tier 0
// image was allowed to route -- that count must be zero.

import Foundation
import CoreML
import Vision

let blocking: Set<String> = ["id_card", "passport", "payment_card", "prescription", "financial_doc"]
let suspicionThreshold = 0.15   // any blocking class above this -> BLOCK even if not top
// Per-class route thresholds (pipeline.md): below this, route as unknown rather than guess.
let routeThreshold: [String: Double] = [
    "business_card": 0.75, "receipt": 0.65, "event_flyer": 0.55,
    "document": 0.50, "medication": 0.65,
]
let defaultRouteThreshold = 0.55

enum L1Decision {
    case block(top: String, p: Double, reason: String)
    case route(category: String, confidence: Double)
}

func decide(_ scores: [(String, Double)]) -> L1Decision {
    let sorted = scores.sorted { $0.1 > $1.1 }
    let (top, topP) = sorted.first ?? ("unknown", 0)
    if blocking.contains(top) { return .block(top: top, p: topP, reason: "top class is Tier 0") }
    for (c, p) in scores where blocking.contains(c) && p > suspicionThreshold {
        return .block(top: c, p: p, reason: "Tier 0 mass \(String(format: "%.2f", p)) > \(suspicionThreshold)")
    }
    let thresh = routeThreshold[top] ?? defaultRouteThreshold
    if topP < thresh { return .route(category: "unknown", confidence: topP) }
    return .route(category: top, confidence: topP)
}

// --- Load model via Vision ---
let args = CommandLine.arguments
let modelPath = args.count > 1 ? args[1] : "L1Classifier.mlmodel"
let testPath = args.count > 2 ? args[2] : "data/test"
let compiled = try MLModel.compileModel(at: URL(fileURLWithPath: modelPath))
let vnModel = try VNCoreMLModel(for: try MLModel(contentsOf: compiled))

func classify(_ url: URL) -> [(String, Double)] {
    let req = VNCoreMLRequest(model: vnModel)
    req.imageCropAndScaleOption = .centerCrop
    try? VNImageRequestHandler(url: url, options: [:]).perform([req])
    let obs = (req.results as? [VNClassificationObservation]) ?? []
    return obs.map { ($0.identifier, Double($0.confidence)) }
}

// --- Run gate over labeled test folder, count Tier 0 leaks ---
let fm = FileManager.default
let classes = (try? fm.contentsOfDirectory(atPath: testPath))?.filter { !$0.hasPrefix(".") }.sorted() ?? []
var leaks = 0, tier0Seen = 0, blockedFalse = 0, routeSafe = 0
print("=== Gate decisions ===")
for cls in classes {
    let dir = URL(fileURLWithPath: testPath).appendingPathComponent(cls)
    let files = (try? fm.contentsOfDirectory(atPath: dir.path))?.filter { let l=$0.lowercased(); return l.hasSuffix(".png")||l.hasSuffix(".jpg")||l.hasSuffix(".jpeg") }.sorted() ?? []
    var summary = [String: Int]()
    for f in files {
        let d = decide(classify(dir.appendingPathComponent(f)))
        switch d {
        case .block(let top, _, _):
            summary["BLOCK(\(top))", default: 0] += 1
            if !blocking.contains(cls) { blockedFalse += 1 }
        case .route(let cat, _):
            summary["route(\(cat))", default: 0] += 1
            if blocking.contains(cls) { leaks += 1 }       // Tier 0 escaped -> critical
            else { routeSafe += 1 }
        }
    }
    if blocking.contains(cls) { tier0Seen += files.count }
    let tag = blocking.contains(cls) ? "[BLOCK]" : "       "
    print("\(tag) \(cls): \(summary.sorted { $0.key < $1.key }.map { "\($0.key)=\($0.value)" }.joined(separator: " "))")
}

print("\n=== Safety summary ===")
print("Tier 0 images seen:        \(tier0Seen)")
print("Tier 0 LEAKS (routed):     \(leaks)   <-- MUST be 0")
print("Safe images routed:        \(routeSafe)")
print("Safe images false-blocked: \(blockedFalse)   (annoying, not dangerous)")
print(leaks == 0 ? "\nPASS: no Tier 0 image escaped the gate." : "\nFAIL: \(leaks) Tier 0 image(s) escaped.")
exit(leaks == 0 ? 0 : 1)
