import CoreGraphics
import CoreML
import Foundation
import SnapActKit

/// Answers one question: can the image encoder live inside a Share Extension?
///
/// An extension that exceeds its memory cap is killed with nothing to catch,
/// so this has to be measured rather than estimated — and measured on a real
/// device, since the numbers here are from a Mac.
///
///     swift run -c release MemProbe [cpu|ane|gpu|all] <image>
///     DUMP_VECTOR=1 swift run -c release MemProbe ane <image>   # 벡터 비교용
///
/// Release build matters: a debug binary carries enough of its own overhead to
/// blur the comparison.
let arguments = Array(CommandLine.arguments.dropFirst())
guard arguments.count >= 2 else {
    print("사용법: MemProbe [cpu|ane|gpu|all] <이미지 경로>")
    exit(2)
}
let label = arguments[0]
let imagePath = arguments[1]

let units: MLComputeUnits
switch label {
case "cpu": units = .cpuOnly
case "ane": units = .cpuAndNeuralEngine
case "gpu": units = .cpuAndGPU
case "all": units = .all
default:
    print("알 수 없는 구성 '\(label)'. cpu | ane | gpu | all 중 하나.")
    exit(2)
}

func mb(_ bytes: UInt64) -> String { String(format: "%6.1f", Double(bytes) / 1_048_576) }

let configuration = MLModelConfiguration()
configuration.computeUnits = units

let base = MemoryFootprint.current()
let encoder = MobileCLIPEncoder(configuration: configuration)
let image = try PixelBuffer.downsample(url: URL(fileURLWithPath: imagePath))

let started = Date()
_ = try encoder.model()
let afterLoad = MemoryFootprint.current()
let loadMs = Date().timeIntervalSince(started) * 1000

// Ten runs because the first pays for lazy pipeline setup and is not what a
// steady-state per-photo cost looks like.
var inferenceMs: [Double] = []
for _ in 0 ..< 10 {
    let t = Date()
    _ = try encoder.embed(image)
    inferenceMs.append(Date().timeIntervalSince(t) * 1000)
}
let afterInference = MemoryFootprint.current()

// Compute units can change numerics. If they do, the Python cross-validation
// reference stops applying and every class score shifts underneath us — so the
// vector is compared across configurations rather than assumed equal.
let vector = try ClassEmbeddings.l2Normalised(try encoder.embed(image))

if ProcessInfo.processInfo.environment["DUMP_VECTOR"] != nil {
    print("VECTOR " + vector.map { String(format: "%.8f", $0) }.joined(separator: " "))
} else {
    let median = inferenceMs.dropFirst().sorted()[4]
    print("\(label.padding(toLength: 4, withPad: " ", startingAt: 0))"
          + " | 시작 \(mb(base)) | 로드후 \(mb(afterLoad)) | 추론10회후 \(mb(afterInference))"
          + " | 증가 \(mb(afterInference - base)) MB"
          + " | 로드 \(String(format: "%5.0f", loadMs))ms"
          + " | 추론 최초 \(String(format: "%5.1f", inferenceMs[0]))ms"
          + " 이후중앙 \(String(format: "%4.1f", median))ms")
    print("     임베딩 앞 6개: "
          + vector.prefix(6).map { String(format: "%.6f", $0) }.joined(separator: ","))
}
