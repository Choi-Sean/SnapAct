import Testing
import CoreGraphics
import Foundation
@testable import SnapActKit

@Suite("차단 게이트")
struct GateTests {

    private func pixel() -> CGImage {
        let context = CGContext(
            data: nil, width: 1, height: 1, bitsPerComponent: 8, bytesPerRow: 4,
            space: CGColorSpaceCreateDeviceRGB(),
            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
        )!
        return context.makeImage()!
    }

    @Test("스텁은 로컬 처리는 허용하되 모델이 없다고 보고한다")
    func stubReportsNoModel() async {
        let result = await UntrainedGate().evaluate(pixel())
        #expect(result.allowsLocalProcessing)
        #expect(result.modelAvailable == false)
    }

    @Test("이번 세션에서는 업로드 가능한 이미지를 만들 수 없다")
    func cannotMakeUploadable() async throws {
        let result = await UntrainedGate().evaluate(pixel())
        #expect(throws: UploadRefusal.gateModelUnavailable) {
            _ = try UploadableImage.make(Data([0xFF, 0xD8]), clearedBy: result)
        }
    }

    @Test("모델이 없으면 .allowed 여도 거절한다 — 순서가 보증이다")
    func allowedIsNotClearance() {
        // The stub returns .allowed so routing and ranking can run. If make()
        // read the decision before modelAvailable, that .allowed would read as
        // clearance and this is exactly the leak the ordering prevents.
        let optimistic = GateResult(decision: .allowed, modelAvailable: false)
        #expect(throws: UploadRefusal.gateModelUnavailable) {
            _ = try UploadableImage.make(Data([0xFF]), clearedBy: optimistic)
        }
    }

    @Test("모델이 있어도 차단 판정이면 거절한다")
    func blockedIsRefusedEvenWithModel() {
        let blocked = GateResult(decision: .blocked(.tierZero(CategoryID("payment_card"))),
                                 modelAvailable: true)
        #expect(throws: UploadRefusal.blockedByGate(.blocked(.tierZero(CategoryID("payment_card"))))) {
            _ = try UploadableImage.make(Data([0xFF]), clearedBy: blocked)
        }
    }

    @Test("게이트가 통과시키고 모델이 있으면 만들어진다 — 거절이 전역이 아님을 확인")
    func succeedsOnlyWithWorkingGate() throws {
        // Without this, every refusal test above would also pass if make()
        // simply always threw.
        let cleared = GateResult(decision: .allowed, modelAvailable: true)
        let image = try UploadableImage.make(Data([0xFF, 0xD8]), clearedBy: cleared)
        #expect(image.bytes.count == 2)
        #expect(image.mediaType == "image/jpeg")
    }

    @Test("차단 판정에는 unknown 이 없다")
    func noUnknownDecision() {
        // privacy.md: below threshold means blocked, never "probably fine".
        // A third case appearing here would be that hedge sneaking back in.
        let reasons: [GateDecision.Reason] = [
            .tierZero(CategoryID("id_document")),
            .notConfidentlySafe,
            .suspected(CategoryID("payment_card")),
        ]
        for reason in reasons {
            #expect(GateDecision.blocked(reason) != .allowed)
        }
    }

    @Test("카탈로그의 차단 클래스는 액션을 갖지 않는다")
    func blockingClassesAreNotServed() throws {
        let catalog = try ActionCatalog.load()
        for name in catalog.blockingClasses.keys {
            #expect(catalog.classes[name] == nil,
                    "\(name) 이 차단 클래스이면서 서비스 클래스입니다")
        }
    }
}
