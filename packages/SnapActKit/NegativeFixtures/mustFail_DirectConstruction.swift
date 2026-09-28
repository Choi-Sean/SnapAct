// UploadableImage's initialiser is private, so the gate cannot be routed
// around by constructing one directly.
import Foundation
import SnapActKit

func bypassViaInit() {
    _ = UploadableImage(validated: Data([0xFF]), mediaType: "image/jpeg")
}
