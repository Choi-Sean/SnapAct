import Testing
import CoreGraphics
import CoreVideo
import CryptoKit
import Foundation
@testable import SnapActKit

/// The gate on step 7.
///
/// class_embeddings.json was produced by the Python pipeline, so an image
/// prepared differently in Swift lands in a subtly different space. Nothing
/// errors; the scores just get worse, which is close to undiagnosable after
/// the fact. This compares end-to-end embeddings of the same files.
@Suite("인코더 교차 검증")
struct EncoderCrossValidationTests {

    /// Below this, preprocessing differs somewhere.
    static let requiredCosine = 0.999

    struct Reference: Decodable {
        let encoderSha256: String
        let dim: Int
        let images: [String: Entry]
        struct Entry: Decodable {
            let sha256: String
            let norm: Double
            let embedding: [Float]   // already unit length
        }
    }

    static var crossValidationDir: URL {
        URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()
            .appendingPathComponent("CrossValidation")
    }

    static func reference() throws -> Reference {
        let url = crossValidationDir.appendingPathComponent("reference.json")
        return try JSONDecoder().decode(Reference.self, from: Data(contentsOf: url))
    }

    @Test("Python 과 Swift 임베딩의 코사인이 0.999 이상이다")
    func embeddingsMatchPython() throws {
        let reference = try Self.reference()
        #expect(reference.images.count >= 3)

        let encoder = MobileCLIPEncoder()
        var worst = (name: "", cosine: 1.0)

        for (name, entry) in reference.images.sorted(by: { $0.key < $1.key }) {
            let url = Self.crossValidationDir
                .appendingPathComponent("images").appendingPathComponent(name)

            // Same file bytes on both sides, or the comparison means nothing.
            let actualSha = try Data(contentsOf: url).sha256Hex
            #expect(actualSha == entry.sha256, "\(name) 파일이 기준값 생성 시점과 다릅니다")

            let image = try PixelBuffer.downsample(url: url)
            let swiftVector = try ClassEmbeddings.l2Normalised(encoder.embed(image))
            #expect(swiftVector.count == reference.dim)

            let cosine = zip(swiftVector, entry.embedding)
                .reduce(0.0) { $0 + Double($1.0) * Double($1.1) }
            if cosine < worst.cosine { worst = (name, cosine) }
            print(String(format: "  %-20s cosine %.6f", (name as NSString).utf8String!, cosine))

            #expect(cosine >= Self.requiredCosine,
                    "\(name): 코사인 \(cosine) — 전처리가 Python 과 어긋납니다")
        }

        // Surfaced even on success: the margin above the threshold is the
        // interesting number, not the pass itself.
        print("  교차 검증 최저 코사인: \(worst.name) \(worst.cosine)")
    }

    @Test("모델 인터페이스가 실측 규격과 일치한다")
    func modelInterfaceMatches() throws {
        let model = try MobileCLIPEncoder().model()
        let input = try #require(model.modelDescription.inputDescriptionsByName["image"])
        #expect(input.type == .image)
        let constraint = try #require(input.imageConstraint)
        #expect(constraint.pixelsWide == 256)
        #expect(constraint.pixelsHigh == 256)
        #expect(model.modelDescription.outputDescriptionsByName["final_emb_1"] != nil)
    }

    @Test("모델은 한 번만 로드된다")
    func modelLoadsOnce() throws {
        let encoder = MobileCLIPEncoder()
        #expect(encoder.loadFootprint == nil)
        let first = try encoder.model()
        let footprint = try #require(encoder.loadFootprint)
        let second = try encoder.model()
        #expect(first === second)
        // Re-loading would have overwritten these.
        #expect(encoder.loadFootprint?.before == footprint.before)

        let delta = Int64(footprint.after) - Int64(footprint.before)
        print("  모델 로드: \(MemoryFootprint.formatted(footprint.before)) -> "
              + "\(MemoryFootprint.formatted(footprint.after)) "
              + "(증가 \(String(format: "%.1f", Double(delta) / 1_048_576)) MB, "
              + "\(String(format: "%.0f", (encoder.loadDuration ?? 0) * 1000)) ms)")
    }

    @Test("종횡비가 달라도 같은 크기 입력이 된다")
    func squashesEveryAspectRatio() throws {
        for name in ["wide.png", "receipt_tall.png", "square.png"] {
            let url = Self.crossValidationDir
                .appendingPathComponent("images").appendingPathComponent(name)
            let image = try PixelBuffer.downsample(url: url)
            let buffer = try PixelBuffer.make(from: image)
            #expect(CVPixelBufferGetWidth(buffer) == 256)
            #expect(CVPixelBufferGetHeight(buffer) == 256)
        }
    }

    @Test("임베딩은 정규화되지 않은 채로 나온다")
    func encoderOutputIsNotNormalised() throws {
        // The reference norms are ~0.84-0.93. If this ever came back at 1.0
        // the encoder would be normalising internally, and normalising again
        // would be harmless — but relying on that without checking is how the
        // opposite mistake gets made.
        let url = Self.crossValidationDir
            .appendingPathComponent("images").appendingPathComponent("square.png")
        let vector = try MobileCLIPEncoder().embed(PixelBuffer.downsample(url: url))
        let norm = sqrt(vector.reduce(0.0) { $0 + Double($1) * Double($1) })
        #expect(abs(norm - 1.0) > 1e-3, "인코더가 이미 정규화해서 내보냅니다 (노름 \(norm))")
    }
}

private extension Data {
    var sha256Hex: String {
        SHA256.hash(data: self).map { String(format: "%02x", $0) }.joined()
    }
}
