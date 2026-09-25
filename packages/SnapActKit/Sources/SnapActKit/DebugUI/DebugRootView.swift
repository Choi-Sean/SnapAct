import SwiftUI

/// Root of the debug/review screen.
///
/// Public and in the library rather than in the executable so the same view
/// runs under `swift run` on macOS now and drops into the iOS app later
/// without being rewritten.
///
/// Step 1 renders the shell only; the panes below are filled by their own
/// steps, and each is listed here so the screen's scope stays visible while
/// it is still empty.
public struct DebugRootView: View {
    public init() {}

    public var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            VStack(alignment: .leading, spacing: 4) {
                Text("SnapAct — Debug")
                    .font(.title2).bold()
                Text("SnapActKit schema v\(SnapActKit.schemaVersion)")
                    .font(.caption).foregroundStyle(.secondary)
            }

            Divider()

            VStack(alignment: .leading, spacing: 8) {
                Text("아직 비어 있습니다 — 1단계는 창이 뜨는 것까지입니다.")
                    .font(.callout)
                ForEach(Self.pendingPanes, id: \.step) { pane in
                    HStack(alignment: .firstTextBaseline, spacing: 8) {
                        Text("\(pane.step)")
                            .font(.caption.monospacedDigit())
                            .foregroundStyle(.secondary)
                            .frame(width: 20, alignment: .trailing)
                        Text(pane.title).font(.callout)
                    }
                }
            }

            Spacer()
        }
        .padding(24)
        .frame(minWidth: 520, minHeight: 420, alignment: .topLeading)
    }

    private struct Pane { let step: Int; let title: String }

    private static let pendingPanes: [Pane] = [
        Pane(step: 6, title: "분류 — 클래스 / 코사인 점수 / margin / 경로 / 소요 ms"),
        Pane(step: 7, title: "상위 5개 클래스, 구조 신호, unknown 판정 이유"),
        Pane(step: 8, title: "OCR — 사용 언어 / 소요 ms / span 개수"),
        Pane(step: 10, title: "액션 후보 점수 분해 + exploration 표시"),
        Pane(step: 11, title: "카운터 리셋 · 로그 JSONL 내보내기"),
        Pane(step: 6, title: "모델 로드 전후 메모리 사용량"),
    ]
}
