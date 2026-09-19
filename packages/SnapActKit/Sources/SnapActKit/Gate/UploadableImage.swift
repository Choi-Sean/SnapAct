import Foundation

/// Image bytes that have cleared the Tier 0 gate.
///
/// The only reason this type exists is that it cannot be constructed any other
/// way. `init` is private, so the sole route to a value is `make(_:clearedBy:)`,
/// which refuses unless a working gate said yes. Any future upload API takes
/// this type and never `Data`, `CGImage` or `UIImage` — which makes "someone
/// added an upload path before the gate worked" a compile error instead of a
/// leak nobody notices.
///
/// This session cannot produce one at all: the gate reports
/// `modelAvailable == false`, so every call to `make` throws. That is the
/// intended state, not a gap to work around.
public struct UploadableImage: Sendable {
    public let bytes: Data
    public let mediaType: String

    // The private initialiser IS the guarantee. A runtime check would not be
    // enough — someone eventually bypasses a runtime check; nobody bypasses a
    // type they cannot construct (privacy.md, "Type-system enforcement").
    private init(validated bytes: Data, mediaType: String) {
        self.bytes = bytes
        self.mediaType = mediaType
    }

    public static func make(
        _ bytes: Data,
        mediaType: String = "image/jpeg",
        clearedBy result: GateResult
    ) throws -> UploadableImage {
        // Order matters: an unavailable model is refused before the decision is
        // even read, so a stub returning `.allowed` can never be mistaken for
        // clearance.
        guard result.modelAvailable else { throw UploadRefusal.gateModelUnavailable }
        guard case .allowed = result.decision else {
            throw UploadRefusal.blockedByGate(result.decision)
        }
        guard !bytes.isEmpty else { throw UploadRefusal.emptyPayload }

        // TODO(privacy): EXIF stripping belongs here — privacy.md requires a
        // single choke point with no bypass route, and this is that point.
        // Not implemented this session because nothing can reach it yet.
        return UploadableImage(validated: bytes, mediaType: mediaType)
    }
}

public enum UploadRefusal: Error, Equatable, CustomStringConvertible {
    case gateModelUnavailable
    case blockedByGate(GateDecision)
    case emptyPayload

    public var description: String {
        switch self {
        case .gateModelUnavailable:
            return "차단 게이트 모델이 아직 없습니다. 업로드 가능한 이미지를 만들 수 없습니다 — 이번 세션에서는 정상입니다."
        case .blockedByGate(let decision):
            return "게이트가 차단했습니다: \(decision)"
        case .emptyPayload:
            return "빈 이미지입니다."
        }
    }
}
