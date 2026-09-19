import Testing
import Foundation

/// Proves that the upload path cannot be written, not merely that it refuses
/// at runtime. Each file in NegativeFixtures/ is type-checked on its own:
/// `mustFail_*` must not compile, `mustCompile_*` must.
///
/// The positive control is not decoration. Without it a wrong module path or
/// SDK would make every fixture fail to compile, and the whole suite would
/// pass while proving nothing.
@Suite("컴파일 가드")
struct CompileGuardTests {

    @Test("업로드 경로는 컴파일 자체가 되지 않는다")
    func negativeFixturesBehaveAsLabelled() throws {
        let fixtures = try Self.fixtureFiles()
        #expect(fixtures.contains { $0.lastPathComponent.hasPrefix("mustCompile_") },
                "양성 대조군이 없으면 이 검사는 공허합니다")
        #expect(fixtures.count >= 4)

        for file in fixtures {
            let name = file.lastPathComponent
            let shouldCompile = name.hasPrefix("mustCompile_")
            let (succeeded, output) = try Self.typecheck(file)

            if shouldCompile {
                #expect(succeeded, """
                    양성 대조군 \(name) 이 컴파일되지 않았습니다. 하네스가 깨진 것이며,
                    이 상태로는 mustFail_ 결과를 믿을 수 없습니다.
                    \(output)
                    """)
            } else {
                #expect(!succeeded, """
                    \(name) 이 컴파일됐습니다. 게이트를 우회하는 경로가 생겼습니다.
                    """)
            }
        }
    }

    // MARK: - Harness

    static var packageRoot: URL {
        // …/Tests/SnapActKitTests/CompileGuardTests.swift -> package root
        URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()   // SnapActKitTests
            .deletingLastPathComponent()   // Tests
            .deletingLastPathComponent()   // package root
    }

    static func fixtureFiles() throws -> [URL] {
        let dir = packageRoot.appendingPathComponent("NegativeFixtures")
        return try FileManager.default
            .contentsOfDirectory(at: dir, includingPropertiesForKeys: nil)
            .filter { $0.pathExtension == "swift" }
            .sorted { $0.lastPathComponent < $1.lastPathComponent }
    }

    /// Where SPM put SnapActKit.swiftmodule for the configuration under test.
    /// Discovered rather than hardcoded so this keeps working on another
    /// architecture or in release.
    static func modulesDirectory() throws -> URL {
        let build = packageRoot.appendingPathComponent(".build")
        let found = FileManager.default.enumerator(at: build, includingPropertiesForKeys: nil)?
            .compactMap { $0 as? URL }
            .first { $0.lastPathComponent == "SnapActKit.swiftmodule" }
        guard let found else {
            throw CompileGuardError.moduleNotBuilt
        }
        return found.deletingLastPathComponent()
    }

    static func typecheck(_ file: URL) throws -> (succeeded: Bool, output: String) {
        let process = Process()
        process.executableURL = URL(fileURLWithPath: "/usr/bin/xcrun")
        process.arguments = ["swiftc", "-typecheck",
                             "-I", try modulesDirectory().path,
                             file.path]
        // xcode-select points at Command Line Tools here, whose toolchain
        // cannot build this package at all.
        process.environment = ProcessInfo.processInfo.environment.merging(
            ["DEVELOPER_DIR": "/Applications/Xcode.app/Contents/Developer"]
        ) { _, new in new }

        let pipe = Pipe()
        process.standardOutput = pipe
        process.standardError = pipe
        try process.run()
        let data = pipe.fileHandleForReading.readDataToEndOfFile()
        process.waitUntilExit()

        return (process.terminationStatus == 0, String(decoding: data, as: UTF8.self))
    }
}

enum CompileGuardError: Error {
    case moduleNotBuilt
}
