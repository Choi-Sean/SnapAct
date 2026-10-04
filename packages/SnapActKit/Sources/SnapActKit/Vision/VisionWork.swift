import Foundation

/// Runs synchronous Vision work off the Swift concurrency cooperative pool.
///
/// `VNImageRequestHandler.perform(_:)` blocks its thread, and Vision
/// internally waits on a dispatch group to do it. Called straight from an
/// `async` function it therefore occupies a cooperative thread while waiting
/// for one — and the pool has only as many threads as the machine has cores.
/// A handful of concurrent routes exhaust it and the process deadlocks.
///
/// That is not hypothetical. `swift test` hung with every worker parked in
/// `VNControlledCapacityTasksQueue.dispatchGroupWait`, reached through
/// `ScenePrefilter.rejection` inside `CLIPRouter.route`, as soon as the
/// prefilter was enabled by giving it a confidence threshold.
///
/// `ios-platform.md` says "never call it on the main queue". The cooperative
/// pool turns out to be the worse place: blocking the main queue freezes the
/// UI, blocking the pool stops everything including whatever would have
/// unblocked it.
enum VisionWork {
    /// Concurrent and unbounded on purpose: Vision has its own capacity queue
    /// and these threads exist to be blocked, which is exactly what a
    /// cooperative thread must never be.
    private static let queue = DispatchQueue(
        label: "com.snapact.vision-blocking",
        qos: .userInitiated,
        attributes: .concurrent
    )

    static func run<T: Sendable>(_ body: @escaping @Sendable () throws -> T) async throws -> T {
        try await withCheckedThrowingContinuation { continuation in
            queue.async {
                continuation.resume(with: Result { try body() })
            }
        }
    }
}
