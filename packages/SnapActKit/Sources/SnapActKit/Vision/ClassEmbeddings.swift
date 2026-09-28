import Accelerate
import Foundation

/// Precomputed CLIP text embeddings, one per class, from Resources/
/// class_embeddings.json.
///
/// These exist so the 85MB text encoder never ships. training/
/// build_clip_prompts.py runs it once on a Mac and writes the vectors here;
/// at runtime there is no text encoding at all, only a dot product against an
/// image embedding.
///
/// Rows are stored as one contiguous matrix rather than per-class arrays so
/// scoring is a single matrix-vector multiply instead of 45 separate loops.
public struct ClassEmbeddings: Sendable {
    public let model: String
    public let dimension: Int

    /// Row order of `matrix`. Index i of this array describes row i.
    public let categories: [CategoryID]
    public let entries: [CategoryID: Entry]

    /// categories.count × dimension, row-major, every row L2-normalised.
    private let matrix: [Float]

    public struct Entry: Sendable {
        public let isNegative: Bool
        public let promptCount: Int
        /// Classes this one cannot be told apart from by image alone. OCR text
        /// arbitrates between them later; see the router.
        public let needsOCRArbitration: [CategoryID]
        /// Biased toward screenshots, so the screenshot signal should raise it.
        public let screenshotBiased: Bool
        public let row: Int
    }

    init(model: String, dimension: Int, categories: [CategoryID],
         entries: [CategoryID: Entry], matrix: [Float]) {
        self.model = model
        self.dimension = dimension
        self.categories = categories
        self.entries = entries
        self.matrix = matrix
    }

    public var count: Int { categories.count }

    public subscript(category: CategoryID) -> Entry? { entries[category] }

    /// The stored vector for one class. Copies, so it is for inspection and
    /// tests rather than the hot path.
    public func embedding(for category: CategoryID) -> [Float]? {
        guard let entry = entries[category] else { return nil }
        let start = entry.row * dimension
        return Array(matrix[start ..< start + dimension])
    }
}

// MARK: - Scoring

public struct ClassSimilarity: Sendable, Equatable {
    public let category: CategoryID
    public let score: Double
    public let isNegative: Bool
}

public extension ClassEmbeddings {
    /// Cosine similarity of `imageEmbedding` against every class, best first.
    ///
    /// The stored rows are already unit length, so cosine reduces to a dot
    /// product — but the query is NOT assumed normalised, because what comes
    /// out of the image encoder is not. Normalising here rather than asking
    /// callers to remember is the difference between a correct score and a
    /// plausible-looking wrong one.
    func similarities(to imageEmbedding: [Float]) throws -> [ClassSimilarity] {
        guard imageEmbedding.count == dimension else {
            throw EmbeddingError.dimensionMismatch(expected: dimension,
                                                   found: imageEmbedding.count)
        }
        let query = try Self.l2Normalised(imageEmbedding)

        var scores = [Float](repeating: 0, count: count)
        // matrix (count × dimension) · query (dimension × 1) -> scores
        vDSP_mmul(matrix, 1, query, 1, &scores, 1,
                  vDSP_Length(count), 1, vDSP_Length(dimension))

        return zip(categories, scores)
            .map { ClassSimilarity(category: $0, score: Double($1),
                                   isNegative: entries[$0]?.isNegative ?? false) }
            .sorted { $0.score > $1.score }
    }

    /// Scales a vector to unit length.
    ///
    /// A zero vector has no direction, so there is no meaningful cosine
    /// against it. Returning zeros would score every class at 0.0 and look
    /// like a confident "nothing matches"; throwing says what actually
    /// happened, which is that the encoder produced nothing usable.
    static func l2Normalised(_ vector: [Float]) throws -> [Float] {
        var norm: Float = 0
        vDSP_svesq(vector, 1, &norm, vDSP_Length(vector.count))
        norm = sqrt(norm)
        guard norm.isFinite, norm > 1e-6 else { throw EmbeddingError.zeroVector }

        var out = [Float](repeating: 0, count: vector.count)
        var divisor = norm
        vDSP_vsdiv(vector, 1, &divisor, &out, 1, vDSP_Length(vector.count))
        return out
    }
}

public enum EmbeddingError: Error, Equatable, CustomStringConvertible {
    case resourceMissing(name: String)
    case decodingFailed(String)
    case modelMismatch(found: String, expected: String)
    case dimensionMismatch(expected: Int, found: Int)
    case rowNotNormalised(CategoryID, norm: Double)
    case unknownArbitrationTarget(CategoryID, referencedBy: CategoryID)
    case zeroVector
    case empty

    public var description: String {
        switch self {
        case .resourceMissing(let name):
            return "\(name) 이 번들에 없습니다."
        case .decodingFailed(let detail):
            return "class_embeddings.json 디코딩 실패: \(detail)"
        case .modelMismatch(let found, let expected):
            return "임베딩이 '\(found)' 용인데 이 빌드는 '\(expected)' 를 씁니다. 같은 인코더로 다시 생성하세요."
        case .dimensionMismatch(let expected, let found):
            return "차원 불일치: \(expected) 기대, \(found) 받음."
        case .rowNotNormalised(let category, let norm):
            return "'\(category)' 의 임베딩이 단위벡터가 아닙니다 (노름 \(norm)). build_clip_prompts.py 가 정규화합니다 — 손으로 편집했는지 확인하세요."
        case .unknownArbitrationTarget(let missing, let source):
            return "'\(source)' 의 needsOCRArbitration 이 없는 클래스 '\(missing)' 를 가리킵니다."
        case .zeroVector:
            return "영벡터는 방향이 없어 코사인을 정의할 수 없습니다. 인코더 출력이 비었는지 확인하세요."
        case .empty:
            return "클래스 임베딩이 하나도 없습니다."
        }
    }
}
