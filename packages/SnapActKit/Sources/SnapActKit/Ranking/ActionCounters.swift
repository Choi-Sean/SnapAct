import Foundation

/// How often a (category, verb) pair was shown and chosen.
///
/// Impressions are counted for every action SHOWN, not only the chosen one.
/// A click-only counter cannot express "offered and declined", which is most
/// of the evidence — an action shown twenty times and never tapped is a strong
/// signal, and invisible without the denominator.
public struct ActionCounter: Codable, Sendable, Equatable {
    public var impressions: Int
    public var clicks: Int

    public init(impressions: Int = 0, clicks: Int = 0) {
        self.impressions = impressions
        self.clicks = clicks
    }
}

public protocol ActionCounterStore: Sendable {
    func counter(category: CategoryID, verb: VerbID) -> ActionCounter
    func recordImpressions(category: CategoryID, verbs: [VerbID])
    func recordClick(category: CategoryID, verb: VerbID)
    /// Public because reviewing personalisation means being able to start over.
    func reset()
    var allCounters: [String: ActionCounter] { get }
}

/// Backed by a shared UserDefaults suite so the app and the Share Extension
/// see the same history. Nothing is sent anywhere; there is no server in this
/// design and no network code in this package.
public final class SharedCounterStore: ActionCounterStore, @unchecked Sendable {
    /// The App Group both targets must declare. A suite that does not exist
    /// makes UserDefaults(suiteName:) return nil, which is why the fallback
    /// below is explicit rather than silent.
    public static let defaultSuiteName = "group.com.snapact.shared"

    private let defaults: UserDefaults
    private let lock = NSLock()
    private let keyPrefix = "counter."

    /// True when the App Group was unavailable and this fell back to standard
    /// defaults — which the extension cannot see. Surfaced rather than hidden,
    /// because the symptom otherwise is "personalisation silently forgets
    /// everything shared from the share sheet".
    public let isSharedContainer: Bool

    public init(suiteName: String = SharedCounterStore.defaultSuiteName) {
        // Neither of the obvious checks works on its own.
        //
        // UserDefaults(suiteName:) returns a usable object for almost any
        // name — it refuses only the bundle identifier and the global domain.
        // containerURL(forSecurityApplicationGroupIdentifier:) returns a path
        // for any name too, at least on macOS; measured, it hands back
        // ~/Library/Group Containers/<whatever> even for a group that was
        // never declared.
        //
        // What actually differs is whether that directory EXISTS, which the
        // system creates only for a group the running target is entitled to.
        let entitled = FileManager.default
            .containerURL(forSecurityApplicationGroupIdentifier: suiteName)
            .map { FileManager.default.fileExists(atPath: $0.path) } ?? false

        if entitled, let suite = UserDefaults(suiteName: suiteName) {
            defaults = suite
            isSharedContainer = true
        } else {
            defaults = .standard
            isSharedContainer = false
        }
    }

    private func key(_ category: CategoryID, _ verb: VerbID) -> String {
        "\(keyPrefix)\(category.rawValue)|\(verb.rawValue)"
    }

    public func counter(category: CategoryID, verb: VerbID) -> ActionCounter {
        lock.lock(); defer { lock.unlock() }
        guard let data = defaults.data(forKey: key(category, verb)),
              let counter = try? JSONDecoder().decode(ActionCounter.self, from: data) else {
            return ActionCounter()
        }
        return counter
    }

    private func mutate(_ category: CategoryID, _ verb: VerbID,
                        _ change: (inout ActionCounter) -> Void) {
        lock.lock(); defer { lock.unlock() }
        let k = key(category, verb)
        var counter = (defaults.data(forKey: k)
            .flatMap { try? JSONDecoder().decode(ActionCounter.self, from: $0) }) ?? ActionCounter()
        change(&counter)
        if let data = try? JSONEncoder().encode(counter) { defaults.set(data, forKey: k) }
    }

    public func recordImpressions(category: CategoryID, verbs: [VerbID]) {
        for verb in verbs { mutate(category, verb) { $0.impressions += 1 } }
    }

    public func recordClick(category: CategoryID, verb: VerbID) {
        mutate(category, verb) { $0.clicks += 1 }
    }

    public func reset() {
        lock.lock(); defer { lock.unlock() }
        for key in defaults.dictionaryRepresentation().keys where key.hasPrefix(keyPrefix) {
            defaults.removeObject(forKey: key)
        }
    }

    public var allCounters: [String: ActionCounter] {
        lock.lock(); defer { lock.unlock() }
        var out: [String: ActionCounter] = [:]
        for (key, value) in defaults.dictionaryRepresentation() where key.hasPrefix(keyPrefix) {
            guard let data = value as? Data,
                  let counter = try? JSONDecoder().decode(ActionCounter.self, from: data) else { continue }
            out[String(key.dropFirst(keyPrefix.count))] = counter
        }
        return out
    }
}

/// For tests, and for the debug screen's "what if the counters were empty".
public final class InMemoryCounterStore: ActionCounterStore, @unchecked Sendable {
    private var storage: [String: ActionCounter] = [:]
    private let lock = NSLock()

    public init() {}

    private func key(_ c: CategoryID, _ v: VerbID) -> String { "\(c.rawValue)|\(v.rawValue)" }

    public func counter(category: CategoryID, verb: VerbID) -> ActionCounter {
        lock.lock(); defer { lock.unlock() }
        return storage[key(category, verb)] ?? ActionCounter()
    }

    public func recordImpressions(category: CategoryID, verbs: [VerbID]) {
        lock.lock(); defer { lock.unlock() }
        for verb in verbs { storage[key(category, verb), default: ActionCounter()].impressions += 1 }
    }

    public func recordClick(category: CategoryID, verb: VerbID) {
        lock.lock(); defer { lock.unlock() }
        storage[key(category, verb), default: ActionCounter()].clicks += 1
    }

    public func reset() {
        lock.lock(); defer { lock.unlock() }
        storage.removeAll()
    }

    public var allCounters: [String: ActionCounter] {
        lock.lock(); defer { lock.unlock() }
        return storage
    }
}
