// Throw any single image at the trained L1 model and see the full probability
// distribution + the fail-closed gate decision. This is the ad-hoc tester.
//
// Usage:  swift classify_one.swift <image.jpg> [L1Classifier.mlmodel]

import Foundation
import CoreML
import Vision

let blocking: Set<String> = ["id_card", "passport", "payment_card", "prescription", "financial_doc"]
let suspicionThreshold = 0.15
let routeThreshold: [String: Double] = [
    "business_card": 0.75, "receipt": 0.65, "event_flyer": 0.55, "document": 0.50, "medication": 0.65,
]
let defaultRouteThreshold = 0.55

let args = CommandLine.arguments
guard args.count > 1 else { print("usage: swift classify_one.swift <image> [model.mlmodel]"); exit(2) }
let imgPath = args[1]
let modelPath = args.count > 2 ? args[2] : "L1Classifier.mlmodel"

let compiled = try MLModel.compileModel(at: URL(fileURLWithPath: modelPath))
let vn = try VNCoreMLModel(for: try MLModel(contentsOf: compiled))
let req = VNCoreMLRequest(model: vn); req.imageCropAndScaleOption = .centerCrop
try VNImageRequestHandler(url: URL(fileURLWithPath: imgPath), options: [:]).perform([req])
let scores = ((req.results as? [VNClassificationObservation]) ?? [])
    .map { ($0.identifier, Double($0.confidence)) }.sorted { $0.1 > $1.1 }

print("\nImage: \(imgPath)")
print("=== probabilities ===")
for (c, p) in scores {
    let bar = String(repeating: "#", count: Int(p * 30))
    print(String(format: "  %@ %-14@ %.3f %@", blocking.contains(c) ? "🔒" : "  ", c as NSString, p, bar))
}

let (top, topP) = scores.first ?? ("unknown", 0)
var decision = ""
if blocking.contains(top) { decision = "BLOCK — top class is Tier 0 (\(top))" }
else if let hit = scores.first(where: { blocking.contains($0.0) && $0.1 > suspicionThreshold }) {
    decision = "BLOCK — Tier 0 suspicion: \(hit.0)=\(String(format: "%.2f", hit.1)) > \(suspicionThreshold)"
} else {
    let t = routeThreshold[top] ?? defaultRouteThreshold
    decision = topP < t ? "ROUTE → unknown (top \(top)=\(String(format: "%.2f", topP)) < \(t))"
                        : "ROUTE → \(top) (confidence \(String(format: "%.2f", topP)))"
}
print("\n=== gate decision ===\n  \(decision)\n")
