//
//  ShareResultView.swift
//  ShareExtension
//
//  The card UI shown in the share sheet — this is the "share a photo, see
//  a result in ~3 seconds" moment the product is built around. Kept to a
//  single screen with no navigation: read result, optionally save, done.
//
import SwiftUI

enum ViewState {
    case loading
    case resolved(AnalysisResult)
    case needsLayer1(Category)
    case failed
}

struct ShareResultView: View {
    let image: UIImage
    let onDone: () -> Void
    let onOpenApp: () -> Void

    @State private var state: ViewState = .loading
    @State private var saving = false
    @State private var saveError: String?
    @State private var saved = false

    var body: some View {
        VStack(spacing: 16) {
            Image(uiImage: image)
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(maxHeight: 180)
                .cornerRadius(14)

            switch state {
            case .loading:
                ProgressView(L10n.analyzing)
                    .padding(.top, 8)

            case .resolved(let result):
                resolvedContent(result)

            case .needsLayer1:
                VStack(spacing: 10) {
                    Text(L10n.needsAppTitle).font(.headline)
                    Text(L10n.needsAppBody)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                    Button(L10n.openAppButton, action: onOpenApp)
                        .buttonStyle(.borderedProminent)
                }

            case .failed:
                VStack(spacing: 10) {
                    Text(L10n.ocrFailed).foregroundColor(.secondary)
                    Button(L10n.openAppButton, action: onOpenApp)
                        .buttonStyle(.borderedProminent)
                }
            }

            Spacer()
            Button(L10n.closeButton, action: onDone)
                .buttonStyle(.bordered)
        }
        .padding()
        .task {
            switch await analyzeOnDevice(image) {
            case .resolved(let result): state = .resolved(result)
            case .needsLayer1(let category): state = .needsLayer1(category)
            case .failed: state = .failed
            }
        }
    }

    @ViewBuilder
    private func resolvedContent(_ result: AnalysisResult) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("\(L10n.categoryLabel): \(categoryName(result.category))")
                .font(.headline)

            if let medication = result.medication {
                if let name = medication.name {
                    Text(name).font(.subheadline)
                }
                if let dosage = medication.dosage {
                    Text(dosage).font(.caption).foregroundColor(.secondary)
                }
            }

            if result.category == .medication, let medication = result.medication, medication.name != nil || medication.dosage != nil {
                if saved {
                    Text(L10n.savedTitle).foregroundColor(.green).bold()
                } else {
                    Button(action: { save(medication) }) {
                        if saving {
                            ProgressView()
                        } else {
                            Text(L10n.saveToReminders)
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(saving)
                }
                if let saveError = saveError {
                    Text(saveError).font(.caption).foregroundColor(.red)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func save(_ medication: MedicationPayload) {
        saving = true
        saveError = nil
        Task {
            do {
                try await saveMedicationReminders(medication, durationDays: 30, fallbackName: categoryName(.medication))
                saved = true
            } catch {
                saveError = L10n.saveFailed
            }
            saving = false
        }
    }
}
