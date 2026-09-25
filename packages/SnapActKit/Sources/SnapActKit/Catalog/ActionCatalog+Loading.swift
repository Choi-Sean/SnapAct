import Foundation

public extension ActionCatalog {
    /// Schema this build understands. The JSON ships inside the same binary,
    /// so a mismatch is a build mistake, not a version-skew situation to
    /// tolerate — hence a hard failure rather than a lenient decode.
    static let supportedSchemaVersion = 1

    static let resourceName = "actions"

    /// Loads and validates the bundled catalog.
    ///
    /// Not cached here. The file is ~54KB and callers hold it for a screen's
    /// lifetime; a shared mutable cache would buy little and cost concurrency
    /// rules on every access.
    /// `bundle` defaults to the package's own resource bundle. It is not the
    /// literal default argument because SPM generates `Bundle.module` as
    /// internal, and an internal value cannot appear in a public signature.
    /// `validating: false` skips the integrity pass. Only for tests that need
    /// to examine one broken invariant without a different one masking it.
    static func load(from bundle: Bundle? = nil, validating: Bool = true) throws -> ActionCatalog {
        let bundle = bundle ?? .module
        guard let url = bundle.url(forResource: resourceName, withExtension: "json") else {
            throw CatalogError.resourceMissing(name: "\(resourceName).json")
        }
        let catalog: ActionCatalog
        do {
            catalog = try JSONDecoder().decode(ActionCatalog.self, from: Data(contentsOf: url))
        } catch let error as DecodingError {
            throw CatalogError.decodingFailed(describe(error))
        }
        if validating { try catalog.validate() }
        return catalog
    }

    /// Every reference inside the catalog resolves.
    ///
    /// build_catalog.py checks the same invariants before writing, so a failure
    /// here means the JSON was edited by hand or the generator regressed. Both
    /// are worth failing a test run over, because the alternative is a button
    /// that silently does nothing.
    ///
    /// Collects every problem rather than throwing at the first. The file is
    /// generated, so it is fixed in one regeneration — reporting one issue per
    /// run would mean one round trip per mistake.
    func validate() throws {
        guard schemaVersion == Self.supportedSchemaVersion else {
            throw CatalogError.schemaMismatch(found: schemaVersion,
                                              expected: Self.supportedSchemaVersion)
        }

        var issues: [String] = []

        for (category, photoClass) in classes.sorted(by: { $0.key.rawValue < $1.key.rawValue }) {
            for action in photoClass.primary + photoClass.secondary where verbs[action.verb] == nil {
                issues.append("\(category) 가 어휘에 없는 동사 '\(action.verb)' 를 씁니다.")
            }
            if let alias = photoClass.aliasOf, classes[alias] == nil {
                issues.append("\(category) 가 없는 클래스 '\(alias)' 를 aliasOf 로 참조합니다.")
            }
            for other in photoClass.coPresentWhenScreenshot where classes[other] == nil {
                issues.append("\(category) 가 없는 클래스 '\(other)' 를 coPresent 로 참조합니다.")
            }
            if photoClass.tier == .zero {
                let egress = Set((photoClass.primary + photoClass.secondary).map(\.verb))
                    .intersection(Self.networkEgressVerbs)
                for verb in egress.sorted(by: { $0.rawValue < $1.rawValue }) {
                    issues.append("Tier 0 클래스 '\(category)' 에 외부 전송 동사 '\(verb)' 가 있습니다.")
                }
            }
        }

        for action in universalActions where verbs[action.verb] == nil {
            issues.append("유니버설 액션이 어휘에 없는 동사 '\(action.verb)' 를 씁니다.")
        }

        for shared in Set(classes.keys).intersection(blockingClasses.keys)
            .sorted(by: { $0.rawValue < $1.rawValue }) {
            issues.append("'\(shared)' 가 서비스 클래스이면서 차단 클래스입니다.")
        }

        if !issues.isEmpty { throw CatalogError.validationFailed(issues) }
    }

    /// Verbs that put content somewhere we cannot see. `call` and
    /// `export_file` are absent on purpose — a dialer handoff and a local file
    /// export are both sanctioned for Tier 0 by the rules docs, and
    /// export_file is the required fallback for Health data.
    static var networkEgressVerbs: Set<VerbID> {
        [VerbID("search"), VerbID("open_url"),
         VerbID("compose_message"), VerbID("export_via_share_sheet")]
    }
}

// MARK: - Lookups

public extension ActionCatalog {
    subscript(category: CategoryID) -> PhotoClass? { classes[category] }
    subscript(verb: VerbID) -> Verb? { verbs[verb] }

    /// Classes sharing a `group`, e.g. "health".
    func categories(inGroup group: String) -> [CategoryID] {
        classes.filter { $0.value.group == group }.keys.sorted { $0.rawValue < $1.rawValue }
    }

    /// True when the spreadsheet has changed since this catalog was generated.
    func isStale(comparedToSpreadsheetSha256 sha: String) -> Bool {
        sourceSha256 != sha
    }
}

public enum CatalogError: Error, CustomStringConvertible {
    case resourceMissing(name: String)
    case decodingFailed(String)
    case schemaMismatch(found: Int, expected: Int)
    case validationFailed([String])

    public var description: String {
        switch self {
        case .resourceMissing(let name):
            return "\(name) 이 번들에 없습니다. Package.swift 의 resources 선언을 확인하세요."
        case .decodingFailed(let detail):
            return "actions.json 디코딩 실패: \(detail)"
        case .schemaMismatch(let found, let expected):
            return "actions.json schemaVersion \(found), 이 빌드는 \(expected) 을 기대합니다. 'make catalog' 로 다시 생성하세요."
        case .validationFailed(let issues):
            return "actions.json 검증 실패 \(issues.count)건:\n" +
                issues.map { "  - " + $0 }.joined(separator: "\n")
        }
    }
}

private func describe(_ error: DecodingError) -> String {
    switch error {
    case .keyNotFound(let key, let ctx):
        return "키 없음 '\(key.stringValue)' (\(path(ctx)))"
    case .typeMismatch(let type, let ctx):
        return "타입 불일치, \(type) 기대 (\(path(ctx)))"
    case .valueNotFound(let type, let ctx):
        return "값 없음, \(type) 기대 (\(path(ctx)))"
    case .dataCorrupted(let ctx):
        // Where an unknown enum case lands — a new confirmation level or tier
        // the generator emitted but this build does not know.
        return "값이 스키마와 맞지 않음 (\(path(ctx))): \(ctx.debugDescription)"
    @unknown default:
        return String(describing: error)
    }
}

private func path(_ context: DecodingError.Context) -> String {
    context.codingPath.map(\.stringValue).joined(separator: ".")
}
