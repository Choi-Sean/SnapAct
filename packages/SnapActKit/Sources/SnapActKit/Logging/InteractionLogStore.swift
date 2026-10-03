import Foundation

/// Append-only local JSONL.
///
/// One JSON object per line, because the file is written a row at a time and
/// read whole: a JSON array would need rewriting the closing bracket on every
/// append, and a truncated write would corrupt the entire file rather than one
/// line. A partly-written last line is recoverable; a partly-written array is
/// not.
///
/// Nothing is transmitted. There is no networking code in this package.
public protocol InteractionLogStore: Sendable {
    func append(_ log: InteractionLog) throws
    func readAll() throws -> [InteractionLog]
    func exportJSONL() throws -> Data
    func clear() throws
}

public final class FileInteractionLogStore: InteractionLogStore, @unchecked Sendable {
    public let url: URL
    private let lock = NSLock()
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    /// - Parameter url: defaults to Application Support. Not the App Group
    ///   container: counters are shared because both targets write them, but
    ///   the log is only ever appended by whoever handled the share, and
    ///   keeping it out of the shared container narrows what an extension can
    ///   read.
    public init(url: URL? = nil) throws {
        if let url {
            self.url = url
        } else {
            let directory = try FileManager.default.url(
                for: .applicationSupportDirectory, in: .userDomainMask,
                appropriateFor: nil, create: true
            ).appendingPathComponent("SnapAct", isDirectory: true)
            try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
            self.url = directory.appendingPathComponent("interactions.jsonl")
        }
        encoder.dateEncodingStrategy = .iso8601
        decoder.dateDecodingStrategy = .iso8601
        // Sorted so a diff between two exports is readable.
        encoder.outputFormatting = [.sortedKeys]
    }

    public func append(_ log: InteractionLog) throws {
        lock.lock(); defer { lock.unlock() }
        var line = try encoder.encode(log)
        line.append(0x0A)   // newline

        if FileManager.default.fileExists(atPath: url.path) {
            let handle = try FileHandle(forWritingTo: url)
            defer { try? handle.close() }
            try handle.seekToEnd()
            try handle.write(contentsOf: line)
        } else {
            try line.write(to: url, options: .atomic)
        }
    }

    public func readAll() throws -> [InteractionLog] {
        lock.lock(); defer { lock.unlock() }
        guard FileManager.default.fileExists(atPath: url.path) else { return [] }
        let data = try Data(contentsOf: url)
        return data.split(separator: 0x0A).compactMap { line in
            // A row that fails to decode is skipped rather than failing the
            // read: a truncated final line from a killed extension must not
            // make the whole history unreadable.
            try? decoder.decode(InteractionLog.self, from: Data(line))
        }
    }

    public func exportJSONL() throws -> Data {
        lock.lock(); defer { lock.unlock() }
        guard FileManager.default.fileExists(atPath: url.path) else { return Data() }
        return try Data(contentsOf: url)
    }

    public func clear() throws {
        lock.lock(); defer { lock.unlock() }
        if FileManager.default.fileExists(atPath: url.path) {
            try FileManager.default.removeItem(at: url)
        }
    }
}

/// For tests and for a debug screen that should not touch the real history.
public final class InMemoryLogStore: InteractionLogStore, @unchecked Sendable {
    private var logs: [InteractionLog] = []
    private let lock = NSLock()
    public init() {}

    public func append(_ log: InteractionLog) throws {
        lock.lock(); defer { lock.unlock() }
        logs.append(log)
    }

    public func readAll() throws -> [InteractionLog] {
        lock.lock(); defer { lock.unlock() }
        return logs
    }

    public func exportJSONL() throws -> Data {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        encoder.outputFormatting = [.sortedKeys]
        lock.lock(); defer { lock.unlock() }
        var out = Data()
        for log in logs {
            out.append(try encoder.encode(log))
            out.append(0x0A)
        }
        return out
    }

    public func clear() throws {
        lock.lock(); defer { lock.unlock() }
        logs.removeAll()
    }
}
