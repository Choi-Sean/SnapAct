import CoreGraphics
import CoreML
import CoreVideo
import Foundation

/// Produces a 512-dim embedding for a photo.
///
/// A protocol so the encoder can be swapped without touching the router. If
/// the Share Extension memory measurement rules MobileCLIP out, a smaller
/// encoder or a stored-embedding kNN takes its place here.
public protocol ImageEmbedder: Sendable {
    /// Raw encoder output — NOT normalised. Callers that need cosine go
    /// through ClassEmbeddings.similarities, which normalises the query.
    func embed(_ image: CGImage) throws -> [Float]
}

/// MobileCLIP-S0 image tower, bundled as mobileclip_s0_image.mlpackage.
///
/// The model is compiled and loaded ONCE, on first use. Compiling an
/// .mlpackage takes hundreds of milliseconds and loading allocates the
/// weights; doing either per photo would dominate the whole pipeline's budget.
///
/// `@unchecked Sendable` rather than an actor: MLModel is documented as
/// thread-safe for prediction, and making this an actor would push `async`
/// into every caller for no gain. The only mutable state is the one-time load,
/// which the lock covers.
public final class MobileCLIPEncoder: ImageEmbedder, @unchecked Sendable {
    public static let modelName = "mobileclip_s0_image"
    public static let inputFeature = "image"
    public static let outputFeature = "final_emb_1"
    public static let embeddingDimension = 512

    private let lock = NSLock()
    private var loaded: MLModel?
    private let bundle: Bundle
    private let configuration: MLModelConfiguration

    /// Footprint in bytes immediately before and after the model was loaded.
    /// nil until the first embed(). This is the number that decides whether
    /// the encoder can live in a Share Extension at all.
    public private(set) var loadFootprint: (before: UInt64, after: UInt64)?
    public private(set) var loadDuration: TimeInterval?

    /// Never worse than Core ML's own default, and on some OS versions much
    /// better.
    ///
    /// Measured in a release build, one process per configuration. The
    /// footprint of `.all` moved a lot between OS releases, so the numbers
    /// are recorded per version rather than as a single fact:
    ///
    ///                        macOS 26.6        macOS 27.0.1
    ///   .cpuOnly             22.2 MB            20.7 MB
    ///   .cpuAndNeuralEngine  22.7 MB            21.9 MB
    ///   .cpuAndGPU           62.4 MB            41.3 MB
    ///   .all (Core ML's own) 48.0 MB            23.7 MB
    ///
    /// On 26.6 `.all` reserved the GPU path and paid ~25 MB for it while
    /// running on the Neural Engine anyway — 25 MB for nothing. On 27.0.1
    /// that penalty is almost gone and the gap is under 2 MB. The choice
    /// still holds either way, and matters most on the older OS that users
    /// are still on.
    ///
    /// What did NOT change across the upgrade: `.all` and
    /// `.cpuAndNeuralEngine` remain bit-identical (cosine 1.000000), and ANE
    /// against the Python reference is still 0.999647. The OS moved memory
    /// accounting, not arithmetic.
    ///
    /// 21.9 MB against 21.7 MB of Float16 weights leaves essentially no
    /// overhead to remove. Quantising further would cost accuracy to save
    /// single digits.
    ///
    /// CPU remains the fallback when the Neural Engine is unavailable, and it
    /// produces slightly different numbers — cosine 0.995 against the ANE
    /// vector, against 0.9996 for ANE against the Python reference. On the
    /// cross-validation images that never changed the ranking (top-1 identical
    /// and top-5 identical on all five), but the margins there are ~0.01, so
    /// treat it as tolerable rather than proven.
    public static func defaultConfiguration() -> MLModelConfiguration {
        let configuration = MLModelConfiguration()
        configuration.computeUnits = .cpuAndNeuralEngine
        return configuration
    }

    public init(bundle: Bundle? = nil, configuration: MLModelConfiguration? = nil) {
        self.bundle = bundle ?? .module
        self.configuration = configuration ?? Self.defaultConfiguration()
    }

    public func model() throws -> MLModel {
        lock.lock()
        defer { lock.unlock() }
        if let loaded { return loaded }

        guard let url = bundle.url(forResource: Self.modelName, withExtension: "mlpackage") else {
            throw EncoderError.modelMissing(name: "\(Self.modelName).mlpackage")
        }

        let before = MemoryFootprint.current()
        let started = Date()
        // .mlpackage ships uncompiled; Core ML wants .mlmodelc. Compiling on
        // first use keeps the bundle small and costs one hit per process.
        let compiled = try MLModel.compileModel(at: url)
        let model = try MLModel(contentsOf: compiled, configuration: configuration)
        loadDuration = Date().timeIntervalSince(started)
        loadFootprint = (before, MemoryFootprint.current())

        try Self.verifyInterface(model)
        loaded = model
        return model
    }

    public func embed(_ image: CGImage) throws -> [Float] {
        let model = try model()
        let buffer = try PixelBuffer.make(from: image)
        let input = try MLDictionaryFeatureProvider(
            dictionary: [Self.inputFeature: MLFeatureValue(pixelBuffer: buffer)]
        )
        let output = try model.prediction(from: input)

        guard let value = output.featureValue(for: Self.outputFeature),
              let array = value.multiArrayValue else {
            throw EncoderError.missingOutput(Self.outputFeature)
        }
        guard array.count == Self.embeddingDimension else {
            throw EncoderError.unexpectedShape(expected: Self.embeddingDimension,
                                               found: array.count)
        }

        var out = [Float](repeating: 0, count: array.count)
        array.withUnsafeBufferPointer(ofType: Float.self) { pointer in
            out.withUnsafeMutableBufferPointer { destination in
                destination.baseAddress?.update(from: pointer.baseAddress!, count: array.count)
            }
        }
        return out
    }

    /// Which hardware the model will actually run on.
    ///
    /// Not a curiosity. Measured over 662 real photos, CPU and Neural Engine
    /// disagree about the top class 6.3% of the time (embedding cosine median
    /// 0.992, minimum 0.971) — so "which device ran this" is a real
    /// confounder in any evaluation, and class_embeddings.json plus whatever
    /// thresholds get tuned are all Neural Engine numbers.
    ///
    /// Asking Core ML directly rather than assuming: requesting
    /// .cpuAndNeuralEngine does not guarantee the Neural Engine was used, and
    /// a silent fall back to CPU would otherwise look like a worse model.
    ///
    /// Costs a compile and a plan load, so this is called once by whoever
    /// records it, not per photo.
    @available(iOS 17.4, macOS 14.4, *)
    public func computeDeviceSummary() async throws -> ComputeDeviceSummary {
        guard let url = bundle.url(forResource: Self.modelName, withExtension: "mlpackage") else {
            throw EncoderError.modelMissing(name: "\(Self.modelName).mlpackage")
        }
        let compiled = try await MLModel.compileModel(at: url)
        let plan = try await MLComputePlan.load(contentsOf: compiled, configuration: configuration)
        // Throws rather than returning zeros: a summary of "nothing ran
        // anywhere" is indistinguishable from a summary that failed to be
        // taken, and the whole point of this is to notice a silent fallback.
        guard case let .program(program) = plan.modelStructure else {
            throw EncoderError.unexpectedInterface(
                "MLComputePlan 구조가 program 이 아닙니다: \(plan.modelStructure)")
        }
        guard let function = program.functions["main"] else {
            throw EncoderError.unexpectedInterface(
                "program 에 main 함수가 없습니다: \(Array(program.functions.keys))")
        }
        var neuralEngine = 0, gpu = 0, cpu = 0
        for operation in function.block.operations {
            // MLComputeDevice is an ENUM, not a protocol with class
            // conformers — so `case is MLNeuralEngineComputeDevice` never
            // matches and every count silently stays zero. Its description
            // prints as "<MLNeuralEngineComputeDevice: 0x…>", which makes the
            // wrong version look like it should work.
            guard let preferred = plan.deviceUsage(for: operation)?.preferred else { continue }
            switch preferred {
            case .neuralEngine: neuralEngine += 1
            case .gpu: gpu += 1
            case .cpu: cpu += 1
            @unknown default: break
            }
        }
        return ComputeDeviceSummary(neuralEngine: neuralEngine, gpu: gpu, cpu: cpu)
    }

    public struct ComputeDeviceSummary: Sendable, Codable, Equatable {
        public let neuralEngine: Int
        public let gpu: Int
        public let cpu: Int

        public var total: Int { neuralEngine + gpu + cpu }
        /// 1.0 means everything ran where the reference embeddings came from.
        public var neuralEngineFraction: Double {
            total == 0 ? 0 : Double(neuralEngine) / Double(total)
        }
        public var description: String {
            "ANE \(neuralEngine) / GPU \(gpu) / CPU \(cpu)"
        }
    }

    /// Fails at load rather than producing nonsense later if the bundled model
    /// is replaced with one that has a different interface.
    private static func verifyInterface(_ model: MLModel) throws {
        let description = model.modelDescription
        guard let input = description.inputDescriptionsByName[inputFeature] else {
            throw EncoderError.unexpectedInterface("입력 '\(inputFeature)' 이 없습니다")
        }
        guard input.type == .image else {
            throw EncoderError.unexpectedInterface(
                "입력 '\(inputFeature)' 이 imageType 이 아닙니다. Swift 쪽 정규화가 필요해질 수 있으니 확인하세요."
            )
        }
        if let constraint = input.imageConstraint {
            guard constraint.pixelsWide == PixelBuffer.side,
                  constraint.pixelsHigh == PixelBuffer.side else {
                throw EncoderError.unexpectedInterface(
                    "입력 크기가 \(constraint.pixelsWide)×\(constraint.pixelsHigh) 입니다. PixelBuffer.side 는 \(PixelBuffer.side)."
                )
            }
        }
        guard description.outputDescriptionsByName[outputFeature] != nil else {
            throw EncoderError.unexpectedInterface("출력 '\(outputFeature)' 이 없습니다")
        }
    }
}

public enum EncoderError: Error, CustomStringConvertible {
    case modelMissing(name: String)
    case missingOutput(String)
    case unexpectedShape(expected: Int, found: Int)
    case unexpectedInterface(String)

    public var description: String {
        switch self {
        case .modelMissing(let name):
            return "\(name) 이 번들에 없습니다."
        case .missingOutput(let name):
            return "모델 출력 '\(name)' 이 없습니다."
        case .unexpectedShape(let expected, let found):
            return "임베딩 길이가 \(found) 입니다. \(expected) 를 기대합니다."
        case .unexpectedInterface(let detail):
            return "모델 인터페이스가 예상과 다릅니다: \(detail)"
        }
    }
}
