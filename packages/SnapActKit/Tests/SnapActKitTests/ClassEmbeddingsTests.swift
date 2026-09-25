import Testing
import Foundation
@testable import SnapActKit

@Suite("클래스 임베딩")
struct ClassEmbeddingsTests {

    private func embeddings() throws -> ClassEmbeddings { try ClassEmbeddings.load() }

    @Test("번들에서 로드되고 스키마가 맞는다")
    func loads() throws {
        let e = try embeddings()
        #expect(e.model == ClassEmbeddings.expectedModel)
        #expect(e.dimension == 512)
        #expect(e.count == 45)
        #expect(e.serviceCategories.count == 37)
        #expect(e.negativeCategories.count == 8)
    }

    @Test("모든 행이 단위벡터다")
    func rowsAreNormalised() throws {
        let e = try embeddings()
        for category in e.categories {
            let v = try #require(e.embedding(for: category))
            #expect(v.count == e.dimension)
            let norm = sqrt(v.reduce(0.0) { $0 + Double($1) * Double($1) })
            #expect(abs(norm - 1.0) <= ClassEmbeddings.normTolerance,
                    "\(category) 노름 \(norm)")
        }
    }

    @Test("차원이 다르면 명확히 실패한다")
    func rejectsWrongDimension() throws {
        let file = RawFile(model: "mobileclip_s0", dim: 512, classes: [
            "x": RawEntry(embedding: [1, 0, 0], isNegative: false, promptCount: 1,
                          needsOCRArbitration: nil, screenshotBiased: nil)
        ])
        #expect(throws: EmbeddingError.dimensionMismatch(expected: 512, found: 3)) {
            _ = try ClassEmbeddings.build(from: file, validating: true)
        }
    }

    @Test("다른 인코더의 임베딩은 거부한다")
    func rejectsWrongModel() throws {
        // Scoring vectors from one encoder against another produces numbers
        // that look fine and mean nothing, so this must not be silent.
        let file = RawFile(model: "mobileclip_s2", dim: 1, classes: [
            "x": RawEntry(embedding: [1], isNegative: false, promptCount: 1,
                          needsOCRArbitration: nil, screenshotBiased: nil)
        ])
        #expect(throws: EmbeddingError.modelMismatch(found: "mobileclip_s2",
                                                     expected: "mobileclip_s0")) {
            _ = try ClassEmbeddings.build(from: file, validating: true)
        }
    }

    @Test("정규화되지 않은 행은 거부한다")
    func rejectsUnnormalisedRow() throws {
        let file = RawFile(model: "mobileclip_s0", dim: 2, classes: [
            "x": RawEntry(embedding: [3, 4], isNegative: false, promptCount: 1,
                          needsOCRArbitration: nil, screenshotBiased: nil)
        ])
        #expect(throws: (any Error).self) {
            _ = try ClassEmbeddings.build(from: file, validating: true)
        }
    }

    // MARK: - Cosine

    @Test("자기 자신과의 코사인은 1이다")
    func selfSimilarityIsOne() throws {
        let e = try embeddings()
        for category in [CategoryID("business_card"), CategoryID("receipt"), CategoryID("neg_food")] {
            let v = try #require(e.embedding(for: category))
            let top = try #require(try e.similarities(to: v).first)
            #expect(top.category == category)
            #expect(abs(top.score - 1.0) < 1e-4, "\(category) 자기유사도 \(top.score)")
        }
    }

    @Test("질의 벡터는 정규화되지 않아도 된다")
    func queryIsNormalisedForCaller() throws {
        // What comes out of the image encoder is not unit length. Scaling the
        // query must not change the ranking or the score.
        let e = try embeddings()
        let v = try #require(e.embedding(for: CategoryID("receipt")))
        let scaled = v.map { $0 * 17.3 }
        let a = try e.similarities(to: v)
        let b = try e.similarities(to: scaled)
        #expect(a.map(\.category) == b.map(\.category))
        #expect(abs(a[0].score - b[0].score) < 1e-5)
    }

    @Test("영벡터는 0점이 아니라 오류다")
    func zeroVectorThrows() throws {
        let e = try embeddings()
        #expect(throws: EmbeddingError.zeroVector) {
            _ = try e.similarities(to: [Float](repeating: 0, count: e.dimension))
        }
    }

    @Test("길이가 다른 질의는 거부한다")
    func wrongQueryLengthThrows() throws {
        let e = try embeddings()
        #expect(throws: EmbeddingError.dimensionMismatch(expected: 512, found: 10)) {
            _ = try e.similarities(to: [Float](repeating: 1, count: 10))
        }
    }

    @Test("Python 과 코사인 값이 일치한다 — A-7 혼동 쌍 기준")
    func matchesPythonReference() throws {
        // Reference values computed with numpy over the same JSON. If Swift's
        // matrix layout or normalisation were wrong, these would drift while
        // every other test still passed.
        let expected: [(String, String, Double)] = [
            ("business_card", "neg_card_other", 0.891982),
            ("profile_screenshot", "chat_screenshot", 0.886541),
            ("handwritten_note", "document_general", 0.877864),
            ("receipt", "bill_invoice", 0.859910),
            ("booking_screenshot", "payment_screenshot", 0.865240),
            ("chat_screenshot", "neg_screenshot_other", 0.838899),
        ]
        let e = try embeddings()
        for (a, b, reference) in expected {
            let query = try #require(e.embedding(for: CategoryID(a)))
            let all = try e.similarities(to: query)
            let found = try #require(all.first { $0.category == CategoryID(b) })
            #expect(abs(found.score - reference) < 1e-5,
                    "\(a) ↔ \(b): Swift \(found.score), Python \(reference)")
        }
    }

    @Test("needsOCRArbitration 이 실재하는 클래스를 가리킨다")
    func arbitrationTargetsExist() throws {
        let e = try embeddings()
        for category in e.categories {
            for target in e[category]?.needsOCRArbitration ?? [] {
                #expect(e[target] != nil, "\(category) -> \(target)")
            }
        }
    }

    @Test("이미지로 못 가르는 쌍이 실제로 서로 가깝다")
    func arbitrationPairsAreActuallyClose() throws {
        // Sanity on the data itself: if a pair flagged for OCR arbitration
        // were already far apart, the flag would be noise.
        let e = try embeddings()
        for category in e.categories {
            guard let entry = e[category], !entry.needsOCRArbitration.isEmpty else { continue }
            let query = try #require(e.embedding(for: category))
            let all = try e.similarities(to: query)
            for target in entry.needsOCRArbitration {
                let score = try #require(all.first { $0.category == target }).score
                #expect(score > 0.7, "\(category) ↔ \(target) 가 \(score) 로 멀어 중재 플래그가 무의미합니다")
            }
        }
    }

    @Test("카탈로그와 임베딩의 클래스 집합이 일치한다")
    func alignsWithCatalog() throws {
        // Two files generated by two scripts. A class added to one and not the
        // other produces a category that can be predicted but has no actions,
        // or actions that can never be reached.
        let catalog = try ActionCatalog.load()
        let e = try embeddings()
        let inCatalog = Set(catalog.classes.keys)
        let inEmbeddings = Set(e.serviceCategories)
        let onlyCatalog = inCatalog.subtracting(inEmbeddings).map(\.rawValue).sorted()
        let onlyEmbeddings = inEmbeddings.subtracting(inCatalog).map(\.rawValue).sorted()
        #expect(inCatalog == inEmbeddings,
                "카탈로그에만: \(onlyCatalog) / 임베딩에만: \(onlyEmbeddings)")
    }
}
