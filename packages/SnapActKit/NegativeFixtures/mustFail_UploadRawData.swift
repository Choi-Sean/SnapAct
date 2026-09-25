// There is no upload function in this package, and any future one must take
// UploadableImage rather than raw bytes. If someone adds `upload(_: Data)`,
// this file starts compiling and the test fails — which is the point.
import Foundation
import SnapActKit

func uploadRawBytes(_ bytes: Data) async throws {
    try await SnapActKit.upload(bytes)
}
