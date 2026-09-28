// Positive control. If this stops compiling, the test harness is broken —
// wrong module path, wrong SDK, wrong target — and every mustFail_ file would
// "pass" for the wrong reason.
import CoreGraphics
import Foundation
import SnapActKit

func control() async {
    let context = CGContext(
        data: nil, width: 1, height: 1, bitsPerComponent: 8, bytesPerRow: 4,
        space: CGColorSpaceCreateDeviceRGB(),
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
    )!
    let image = context.makeImage()!

    let result = await UntrainedGate().evaluate(image)
    _ = result.allowsLocalProcessing
    _ = result.modelAvailable

    // make() is reachable and throws at runtime; that is the supported shape.
    _ = try? UploadableImage.make(Data([0xFF]), clearedBy: result)
}
