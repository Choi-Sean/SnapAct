// make() requires a GateResult. There is no overload that omits it, so
// "just upload it" cannot be written even by someone who never read the docs.
import Foundation
import SnapActKit

func makeWithoutGate() throws {
    _ = try UploadableImage.make(Data([0xFF]))
}
