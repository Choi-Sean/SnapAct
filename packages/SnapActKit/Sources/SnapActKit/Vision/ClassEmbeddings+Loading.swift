import Foundation

public extension ClassEmbeddings {
    /// The image encoder these vectors were produced against. A mismatch means
    /// the two halves of the comparison come from different models, which
    /// yields plausible-looking numbers that mean nothing — so it is checked
    /// rather than assumed.
    static let expectedModel = "mobileclip_s0"
    static let resourceName = "class_embeddings"

    /// Rows are written already normalised; this is the tolerance for float
    /// round-trip through JSON, not a licence to be approximately unit length.
    static let normTolerance: Double = 1e-3

    static func load(from bundle: Bundle? = nil, validating: Bool = true) throws -> ClassEmbeddings {
        let bundle = bundle ?? .module
        guard let url = bundle.url(forResource: resourceName, withExtension: "json") else {
            throw EmbeddingError.resourceMissing(name: "\(resourceName).json")
        }
        let file: RawFile
        do {
            file = try JSONDecoder().decode(RawFile.self, from: Data(contentsOf: url))
        } catch {
            throw EmbeddingError.decodingFailed(String(describing: error))
        }
        return try build(from: file, validating: validating)
    }

    internal static func build(from file: RawFile, validating: Bool) throws -> ClassEmbeddings {
        guard file.model == expectedModel else {
            throw EmbeddingError.modelMismatch(found: file.model, expected: expectedModel)
        }
        guard !file.classes.isEmpty else { throw EmbeddingError.empty }

        // Sorted so row order is deterministic across runs. Dictionary order
        // is not, and a debug screen that reshuffles its rows between launches
        // is hard to read and harder to trust.
        let names = file.classes.keys.sorted()

        var categories: [CategoryID] = []
        var entries: [CategoryID: Entry] = [:]
        var matrix: [Float] = []
        matrix.reserveCapacity(names.count * file.dim)

        for (row, name) in names.enumerated() {
            let raw = file.classes[name]!
            guard raw.embedding.count == file.dim else {
                throw EmbeddingError.dimensionMismatch(expected: file.dim,
                                                       found: raw.embedding.count)
            }
            let category = CategoryID(name)
            if validating {
                let norm = sqrt(raw.embedding.reduce(0.0) { $0 + Double($1) * Double($1) })
                guard abs(norm - 1.0) <= normTolerance else {
                    throw EmbeddingError.rowNotNormalised(category, norm: norm)
                }
            }
            categories.append(category)
            entries[category] = Entry(
                isNegative: raw.isNegative,
                promptCount: raw.promptCount,
                needsOCRArbitration: (raw.needsOCRArbitration ?? []).map { CategoryID($0) },
                screenshotBiased: raw.screenshotBiased ?? false,
                row: row
            )
            matrix.append(contentsOf: raw.embedding)
        }

        if validating {
            for (category, entry) in entries {
                for target in entry.needsOCRArbitration where entries[target] == nil {
                    throw EmbeddingError.unknownArbitrationTarget(target, referencedBy: category)
                }
            }
        }

        return ClassEmbeddings(model: file.model, dimension: file.dim,
                               categories: categories, entries: entries, matrix: matrix)
    }

    /// Classes that are not real categories: a top score on one of these means
    /// the photo is food, a pet, scenery — nothing we act on. The router turns
    /// that into `unknown` rather than a low-confidence guess.
    var negativeCategories: [CategoryID] {
        categories.filter { entries[$0]?.isNegative == true }
    }

    var serviceCategories: [CategoryID] {
        categories.filter { entries[$0]?.isNegative == false }
    }
}

// MARK: - File shape

internal struct RawFile: Decodable {
    let model: String
    let dim: Int
    let classes: [String: RawEntry]
}

internal struct RawEntry: Decodable {
    let embedding: [Float]
    let isNegative: Bool
    let promptCount: Int
    let needsOCRArbitration: [String]?
    let screenshotBiased: Bool?
}
