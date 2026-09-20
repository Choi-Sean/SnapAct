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

    public init(bundle: Bundle? = nil, configuration: MLModelConfiguration = .init()) {
        self.bundle = bundle ?? .module
        self.configuration = configuration
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
