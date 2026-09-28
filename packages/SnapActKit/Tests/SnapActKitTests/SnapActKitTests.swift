import Testing
@testable import SnapActKit

// Step 1 only asserts the package builds and is importable from a test
// target. Real tests land with the code they cover, step by step.
@Test func packageBuildsAndIsImportable() {
    #expect(SnapActKit.schemaVersion == 1)
}
