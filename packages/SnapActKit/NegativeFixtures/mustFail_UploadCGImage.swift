// Same guard for the image types. A function taking CGImage or UIImage would
// skip the gate just as effectively as one taking Data.
import CoreGraphics
import SnapActKit

func uploadImage(_ image: CGImage) async throws {
    try await SnapActKit.upload(image)
}
