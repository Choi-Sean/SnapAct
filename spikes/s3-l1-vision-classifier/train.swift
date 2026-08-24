// Train + evaluate the L1 classifier (Create ML transfer learning on Vision's
// scene-print feature extractor -- this IS the S3 hypothesis) and export Core ML.
//
// Usage:  swift train.swift
// Reads:  data/train/<class>/*.png, data/test/<class>/*.png
// Writes: L1Classifier.mlmodel  (compact, on-device)
//
// The number S3 must report is BLOCKING RECALL: of the Tier 0 images, how many were
// classified into *some* blocking class (so the fail-closed gate would block them).
// A blocking image predicted as a routing class is a LEAK -- the failure that matters.

import CreateML
import Foundation

let blocking: Set<String> = ["id_card", "passport", "payment_card", "prescription", "financial_doc"]
let cwd = FileManager.default.currentDirectoryPath
let cliArgs = CommandLine.arguments
let trainDir = URL(fileURLWithPath: cliArgs.count > 1 ? cliArgs[1] : "\(cwd)/data/train")
let testDir = URL(fileURLWithPath: cliArgs.count > 2 ? cliArgs[2] : "\(cwd)/data/test")
let outURL = URL(fileURLWithPath: "\(cwd)/L1Classifier.mlmodel")

func die(_ m: String) -> Never { FileHandle.standardError.write(Data("ERROR: \(m)\n".utf8)); exit(1) }
func isImage(_ f: String) -> Bool { let l = f.lowercased(); return l.hasSuffix(".png") || l.hasSuffix(".jpg") || l.hasSuffix(".jpeg") }

print("Training on \(trainDir.path) ...")
let model: MLImageClassifier
do {
    // Defaults use scene-print feature extraction + a logistic head: few images, small model.
    model = try MLImageClassifier(trainingData: .labeledDirectories(at: trainDir))
} catch { die("training failed: \(error)") }

// --- Manual evaluation so we control exactly which numbers we report ---
let fm = FileManager.default
let classes = (try? fm.contentsOfDirectory(atPath: testDir.path))?
    .filter { !$0.hasPrefix(".") }.sorted() ?? []
if classes.isEmpty { die("no test classes under \(testDir.path)") }

var total = [String: Int]()          // per true class
var correct = [String: Int]()        // predicted exact class
var blockedOK = [String: Int]()      // blocking image predicted into SOME blocking class
var leaks = [(String, String, String)]()  // (file, trueClass, predicted) for blocking leaks
var confusion = [String: [String: Int]]()

for cls in classes {
    let dir = testDir.appendingPathComponent(cls)
    let files = (try? fm.contentsOfDirectory(atPath: dir.path))?.filter { isImage($0) } ?? []
    for f in files {
        let url = dir.appendingPathComponent(f)
        guard let pred = try? model.prediction(from: url) else { continue }
        total[cls, default: 0] += 1
        confusion[cls, default: [:]][pred, default: 0] += 1
        if pred == cls { correct[cls, default: 0] += 1 }
        if blocking.contains(cls) {
            if blocking.contains(pred) { blockedOK[cls, default: 0] += 1 }
            else { leaks.append((f, cls, pred)) }
        }
    }
}

func pct(_ a: Int, _ b: Int) -> String { b == 0 ? "n/a" : String(format: "%.0f%%", 100.0 * Double(a) / Double(b)) }

print("\n=== Per-class recall (exact) ===")
for cls in classes {
    let tag = blocking.contains(cls) ? "[BLOCK]" : "       "
    print(String(format: "%@ %-14@ %@  (%d/%d)", tag, cls as NSString, pct(correct[cls] ?? 0, total[cls] ?? 0), correct[cls] ?? 0, total[cls] ?? 0))
}

let bTotal = blocking.reduce(0) { $0 + (total[$1] ?? 0) }
let bOK = blocking.reduce(0) { $0 + (blockedOK[$1] ?? 0) }
let rTotal = classes.filter { !blocking.contains($0) }.reduce(0) { $0 + (total[$1] ?? 0) }
let rCorrect = classes.filter { !blocking.contains($0) }.reduce(0) { $0 + (correct[$1] ?? 0) }

print("\n=== S3 headline numbers ===")
print("BLOCKING RECALL (Tier 0 caught by gate): \(pct(bOK, bTotal))  (\(bOK)/\(bTotal))   <-- the safety metric")
print("Router accuracy on safe classes:         \(pct(rCorrect, rTotal))  (\(rCorrect)/\(rTotal))")

print("\n=== LEAKS (Tier 0 -> routing class = would NOT be blocked) ===")
if leaks.isEmpty { print("  none") }
else { for (f, t, p) in leaks { print("  \(t)/\(f)  ->  \(p)") } }

print("\n=== Confusion (true -> predicted) ===")
for cls in classes {
    let row = (confusion[cls] ?? [:]).sorted { $0.value > $1.value }
        .map { "\($0.key):\($0.value)" }.joined(separator: " ")
    print(String(format: "%-14@ %@", cls as NSString, row))
}

do { try model.write(to: outURL); print("\nExported \(outURL.lastPathComponent)") }
catch { die("export failed: \(error)") }
