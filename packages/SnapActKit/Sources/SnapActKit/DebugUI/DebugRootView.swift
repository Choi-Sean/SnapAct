import AppKit
import SwiftUI
import UniformTypeIdentifiers

/// The review screen.
///
/// Its purpose is showing WHY an ordering happened. A screen that shows only
/// the final list can be agreed with but not reviewed, so the score breakdown
/// is the centre of it and everything else is context for that.
///
/// Public and in the library so the same view runs under `swift run` on macOS
/// today and drops into the iOS app unchanged.
public struct DebugRootView: View {
    @State private var model: DebugModel
    @State private var isTargeted = false

    public init(model: DebugModel? = nil) {
        _model = State(initialValue: model ?? DebugModel())
    }

    public var body: some View {
        HSplitView {
            sidebar.frame(minWidth: 240, idealWidth: 280)
            detail.frame(minWidth: 620)
        }
        .frame(minWidth: 980, minHeight: 680)
        .toolbar { toolbar }
    }

    // MARK: - Sidebar

    private var sidebar: some View {
        VStack(alignment: .leading, spacing: 0) {
            dropZone
            Divider()
            if model.rows.isEmpty {
                unconfiguredNotice.padding(12)
                Spacer()
            } else {
                List(model.rows, selection: Binding(
                    get: { model.selected },
                    set: { newValue in if let newValue { model.select(newValue) } }
                )) { row in
                    VStack(alignment: .leading, spacing: 2) {
                        Text(row.fileName).font(.callout).lineLimit(1)
                        Text(row.error != nil ? "오류"
                             : row.outcome.map { "\($0.routing.category) · \($0.timings.totalMs)ms" }
                                ?? "대기")
                            .font(.caption).foregroundStyle(.secondary)
                    }
                    .tag(row.id)
                }
            }
            Divider()
            Text(model.status).font(.caption).foregroundStyle(.secondary)
                .padding(10).frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var dropZone: some View {
        VStack(spacing: 6) {
            Image(systemName: "photo.on.rectangle.angled").font(.title2)
            Text("사진을 끌어다 놓기").font(.callout)
            Text("여러 장 가능").font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity).padding(.vertical, 22)
        .background(isTargeted ? Color.accentColor.opacity(0.15) : Color.clear)
        .contentShape(Rectangle())
        .dropDestination(for: URL.self) { urls, _ in
            let images = urls.filter { url in
                ["jpg", "jpeg", "png", "heic", "webp", "tiff"]
                    .contains(url.pathExtension.lowercased())
            }
            guard !images.isEmpty else { return false }
            model.add(images)
            return true
        } isTargeted: { isTargeted = $0 }
    }

    private var unconfiguredNotice: some View {
        let missing = model.unconfigured
        return VStack(alignment: .leading, spacing: 6) {
            Label("아직 정해지지 않은 설정", systemImage: "exclamationmark.triangle")
                .font(.callout)
            Text("아래가 null 인 동안 라우터는 클래스를 주장하지 않고 unknown 을 돌려줍니다. "
                 + "점수는 그대로 실려 오니 그것으로 임계값을 정하시면 됩니다.")
                .font(.caption).foregroundStyle(.secondary)
            ForEach(missing, id: \.self) { item in
                Text("· \(item)").font(.caption).monospaced()
            }
        }
    }

    // MARK: - Detail

    private var detail: some View {
        ScrollView {
            if let row = model.current, let outcome = row.outcome {
                VStack(alignment: .leading, spacing: 20) {
                    preview(row)
                    classification(outcome)
                    topClasses(outcome)
                    structuralSignals(outcome)
                    ocrSection(outcome)
                    actionBreakdown(outcome, row: row)
                    environment
                }
                .padding(20)
            } else if let row = model.current, let error = row.error {
                Text(error).font(.callout).monospaced().padding(20)
            } else {
                Text("왼쪽에 사진을 놓으면 여기에 분해 결과가 나옵니다.")
                    .foregroundStyle(.secondary).padding(40)
            }
        }
    }

    private func preview(_ row: DebugModel.Row) -> some View {
        HStack(alignment: .top, spacing: 14) {
            if let image = NSImage(contentsOf: row.url) {
                Image(nsImage: image).resizable().scaledToFit()
                    .frame(width: 130, height: 130)
                    .background(Color.secondary.opacity(0.1))
            }
            VStack(alignment: .leading, spacing: 3) {
                Text(row.fileName).font(.headline)
                if let outcome = row.outcome {
                    let t = outcome.timings
                    Text("gate \(t.gateMs) · signals \(t.signalsMs) · routing \(t.routingMs)"
                         + " · rank \(t.rankingMs) · ocr \(t.ocrMs) · arb \(t.arbitrationMs)")
                        .font(.caption).monospaced().foregroundStyle(.secondary)
                    Text("합계 \(t.totalMs)ms").font(.caption).monospaced()
                    Text("첫 장은 모델 로드가 포함돼 느립니다. 두 번째부터가 실제 비용입니다.")
                        .font(.caption2).foregroundStyle(.secondary)
                }
            }
            Spacer()
        }
    }

    private func classification(_ outcome: PhotoPipeline.Outcome) -> some View {
        section("분류") {
            HStack(spacing: 24) {
                figure("클래스", "\(outcome.routing.category)")
                figure("코사인", String(format: "%.4f", outcome.routing.score))
                figure("margin", String(format: "%.4f", outcome.routing.margin))
                figure("경로", outcome.routing.source.rawValue)
            }
            if outcome.routing.isUnknown, let reason = outcome.routing.unknownReason {
                Label("unknown 사유: \(String(describing: reason))", systemImage: "questionmark.circle")
                    .font(.caption).foregroundStyle(.orange)
            }
            if !outcome.categories.isEmpty, outcome.categories.count > 1 {
                Text("OCR 중재로 추가된 후보: "
                     + outcome.categories.dropFirst().map(\.rawValue).joined(separator: ", "))
                    .font(.caption).foregroundStyle(.secondary)
            }
            if !outcome.gate.allowsLocalProcessing {
                Label("게이트가 차단했습니다 — 라우팅·OCR 모두 건너뜀", systemImage: "hand.raised.fill")
                    .font(.caption).foregroundStyle(.red)
            }
        }
    }

    private func topClasses(_ outcome: PhotoPipeline.Outcome) -> some View {
        section("상위 5개 클래스") {
            if outcome.routing.alternates.isEmpty {
                Text("없음").font(.caption).foregroundStyle(.secondary)
            } else {
                grid(columns: ["클래스", "코사인", "구분"]) {
                    ForEach(Array(outcome.routing.alternates.prefix(5).enumerated()), id: \.offset) { _, item in
                        GridRow {
                            Text(item.category.rawValue).monospaced()
                            Text(String(format: "%.4f", item.score)).monospaced()
                            Text(item.isNegative ? "네거티브" : "서비스")
                                .foregroundStyle(item.isNegative ? .orange : .primary)
                        }
                        .font(.caption)
                    }
                }
            }
        }
    }

    private func structuralSignals(_ outcome: PhotoPipeline.Outcome) -> some View {
        section("구조 신호") {
            HStack(spacing: 24) {
                figure("종횡비", String(format: "%.2f", outcome.signals.aspectRatio))
                figure("스크린샷", outcome.signals.isScreenshot ? "예" : "아니오")
                figure("문서 외곽", outcome.signals.hasDocumentEdges ? "검출" : "없음")
                figure("텍스트", outcome.signals.hasText ? "있음" : "없음")
            }
            if outcome.routing.structuralAdjustments.isEmpty {
                Text("가중치가 아직 null 이라 점수 보정은 적용되지 않았습니다.")
                    .font(.caption2).foregroundStyle(.secondary)
            } else {
                Text(outcome.routing.structuralAdjustments
                        .map { "\($0.key) ×\(String(format: "%.2f", $0.value))" }
                        .sorted().joined(separator: "  "))
                    .font(.caption).monospaced()
            }
        }
    }

    private func ocrSection(_ outcome: PhotoPipeline.Outcome) -> some View {
        section("OCR") {
            if let ocr = outcome.ocr {
                HStack(spacing: 24) {
                    figure("수행", ocr.didRun ? "예" : "아니오")
                    figure("소요", "\(ocr.durationMs)ms")
                    figure("span", "\(ocr.spans.count)")
                    figure("언어", ocr.plan?.languages.joined(separator: ", ") ?? "-")
                    figure("수준", ocr.plan?.level.rawValue ?? "-")
                }
                if let skipped = ocr.skipped {
                    Text("건너뜀: \(String(describing: skipped))")
                        .font(.caption).foregroundStyle(.secondary)
                }
                if !ocr.spans.isEmpty {
                    // Shown here, never written to the log — the screen is
                    // on-device review, the log is a record that outlives it.
                    Text(ocr.spans.map(\.text).joined(separator: "\n"))
                        .font(.caption).monospaced().textSelection(.enabled)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(8).background(Color.secondary.opacity(0.08))
                    Text("원문은 화면에만 표시합니다. 로그에는 존재 여부와 길이만 남습니다.")
                        .font(.caption2).foregroundStyle(.secondary)
                }
            } else {
                Text("아직 실행 전 (빠른 경로만 끝난 상태)")
                    .font(.caption).foregroundStyle(.secondary)
            }
        }
    }

    private func actionBreakdown(_ outcome: PhotoPipeline.Outcome, row: DebugModel.Row) -> some View {
        section("액션 후보 — 점수 분해") {
            if outcome.ranking.explorationApplied {
                Label("탐색 적용됨: \(outcome.ranking.promoted.map(\.rawValue) ?? "-") 승격",
                      systemImage: "shuffle")
                    .font(.caption).foregroundStyle(.purple)
            }
            if let photoClass = model.photoClass(for: outcome.routing.category) {
                HStack(spacing: 24) {
                    figure("검토결과", photoClass.reviewVerdict)
                    figure("클래스 점수", String(format: "%.0f", photoClass.classScore))
                }
                if photoClass.classScore == 0 {
                    Text("점수 0 (\(photoClass.reviewVerdict)) — 이 클래스의 고유 액션은 유니버설 액션 "
                         + "위로 올라가지 않습니다. 엑셀의 '랭킹 초기 점수' 를 채우면 바뀝니다.")
                        .font(.caption).foregroundStyle(.orange)
                }
            }
            grid(columns: ["#", "동사", "slot", "basePrior", "clicks/impr", "smoothed",
                           "ctx", "profile", "점수", "원순위", ""]) {
                ForEach(Array(outcome.ranking.actions.enumerated()), id: \.offset) { index, action in
                    GridRow {
                        Text("\(index + 1)").monospaced()
                        Text(action.verb.rawValue).monospaced()
                            .foregroundStyle(index < 3 ? .primary : .secondary)
                        Text(action.candidate.slotScore.map { String(format: "%.2f", $0) } ?? "-")
                            .monospaced().foregroundStyle(.secondary)
                        Text(String(format: "%.3f", action.candidate.basePrior)).monospaced()
                        Text("\(action.counter.clicks)/\(action.counter.impressions)").monospaced()
                        Text(String(format: "%.4f", action.smoothedRate)).monospaced()
                        Text(String(format: "%.2f", action.contextBoost)).monospaced()
                        Text(String(format: "%.2f", action.profileBoost)).monospaced()
                        Text(String(format: "%.4f", action.score)).monospaced().bold()
                        Text("\(action.naturalRank)").monospaced().foregroundStyle(.secondary)
                        Button("탭") { model.choose(action.verb, in: row) }
                            .buttonStyle(.borderless).font(.caption)
                    }
                    .font(.caption)
                }
            }
            Text("'탭' 은 카운터와 로그만 남깁니다. 실제 액션 실행은 이번 범위 밖입니다.")
                .font(.caption2).foregroundStyle(.secondary)
        }
    }

    private var environment: some View {
        section("환경") {
            HStack(spacing: 24) {
                if let before = model.memoryBefore, let after = model.memoryAfter {
                    figure("모델 로드 전", MemoryFootprint.formatted(before))
                    figure("로드 후", MemoryFootprint.formatted(after))
                    figure("증가", MemoryFootprint.formatted(after &- before))
                }
                if let ms = model.modelLoadMs { figure("로드 시간", "\(ms)ms") }
            }
            if let devices = model.computeDevices {
                figure("컴퓨트 장치", devices.description
                       + String(format: " (ANE %.0f%%)", devices.neuralEngineFraction * 100))
                if devices.neuralEngineFraction < 0.9 {
                    Label("ANE 에서 안 돌고 있습니다 — 실사진 662장 기준 CPU 는 1위 클래스가 6.3% 달라집니다.",
                          systemImage: "exclamationmark.triangle.fill")
                        .font(.caption).foregroundStyle(.red)
                }
            }
            // Below iOS 26 the framework does not exist, which is a different
            // thing from being switched off — the screen should say which.
            if #available(iOS 26, macOS 26, *) {
                figure("Foundation Models", FoundationModelsArbiter.availabilityDescription)
            } else {
                figure("Foundation Models", "이 OS 에 없음 (iOS 26+ 필요)")
            }
            figure("기록된 로그", "\(model.logCount)건")
        }
    }

    // MARK: - Toolbar and building blocks

    @ToolbarContentBuilder
    private var toolbar: some ToolbarContent {
        ToolbarItemGroup {
            if model.isBusy { ProgressView().controlSize(.small) }
            Button("카운터 리셋") { model.resetCounters() }
            Button("로그 비우기") { model.clearLogs() }
            Button("JSONL 내보내기") { exportJSONL() }
            Button("사진 지우기") { model.clearPhotos() }
        }
    }

    private func exportJSONL() {
        let panel = NSSavePanel()
        panel.nameFieldStringValue = "snapact-interactions.jsonl"
        panel.allowedContentTypes = [UTType(filenameExtension: "jsonl") ?? .plainText]
        guard panel.runModal() == .OK, let url = panel.url else { return }
        try? model.exportJSONL().write(to: url)
    }

    private func section(_ title: String,
                         @ViewBuilder content: () -> some View) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title).font(.headline)
            content()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func figure(_ label: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 1) {
            Text(label).font(.caption2).foregroundStyle(.secondary)
            Text(value).font(.callout).monospaced()
        }
    }

    private func grid(columns: [String],
                      @ViewBuilder rows: () -> some View) -> some View {
        Grid(alignment: .leading, horizontalSpacing: 14, verticalSpacing: 4) {
            GridRow {
                ForEach(columns, id: \.self) { column in
                    Text(column).font(.caption2).foregroundStyle(.secondary)
                }
            }
            Divider().gridCellUnsizedAxes(.horizontal)
            rows()
        }
    }
}
