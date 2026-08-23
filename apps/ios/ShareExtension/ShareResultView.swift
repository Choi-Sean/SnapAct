//
//  ShareResultView.swift
//  ShareExtension
//
//  The card UI shown in the share sheet — this is the "share a photo, see
//  a result in ~3 seconds" moment the product is built around. Kept to a
//  single screen with no navigation: read result, optionally save, done.
//
//  Routing: Layer 0 (LayerZeroAnalyzer) runs first; medication/document/
//  other resolve fully here. business_card/receipt/event_flyer always
//  needed Claude, so those fall through to a real Layer 1 network call
//  (Layer1Client) and just show whatever comes back — including the
//  "requires_tokens" locked message for a guest or an out-of-tokens
//  account, same as the RN app would show.
//
import SwiftUI

enum ViewState {
    case loading
    case resolvedLayer0(AnalysisResult)
    case loadingLayer1
    case resolvedLayer1(Layer1Response)
    case layer1Failed
    case ocrFailed
}

struct ShareResultView: View {
    let image: UIImage
    let metadata: PhotoMetadata?
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
                ProgressView(L10n.analyzing).padding(.top, 8)

            case .resolvedLayer0(let result):
                layer0Content(result)

            case .loadingLayer1:
                ProgressView(L10n.layer1Loading).padding(.top, 8)

            case .resolvedLayer1(let response):
                layer1Content(response)

            case .layer1Failed:
                VStack(spacing: 10) {
                    Text(L10n.layer1FailedTitle).foregroundColor(.secondary)
                    Button(L10n.openAppButton, action: onOpenApp).buttonStyle(.borderedProminent)
                }

            case .ocrFailed:
                VStack(spacing: 10) {
                    Text(L10n.ocrFailed).foregroundColor(.secondary)
                    Button(L10n.openAppButton, action: onOpenApp).buttonStyle(.borderedProminent)
                }
            }

            Spacer()
            Button(L10n.closeButton, action: onDone).buttonStyle(.bordered)
        }
        .padding()
        .task {
            switch await analyzeOnDevice(image, metadata: metadata) {
            case .resolved(let result):
                state = .resolvedLayer0(result)
            case .needsLayer1:
                state = .loadingLayer1
                await runLayer1()
            case .failed:
                state = .ocrFailed
            }
        }
    }

    private func runLayer1() async {
        do {
            let response = try await analyzeViaLayer1(image)
            state = .resolvedLayer1(response)
        } catch {
            state = .layer1Failed
        }
    }

    @ViewBuilder
    private func layer0Content(_ result: AnalysisResult) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("\(L10n.categoryLabel): \(categoryName(result.category))").font(.headline)

            if let medication = result.medication {
                if let name = medication.name { Text(name).font(.subheadline) }
                if let dosage = medication.dosage { Text(dosage).font(.caption).foregroundColor(.secondary) }
            }

            if result.category == .medication, let medication = result.medication, medication.name != nil || medication.dosage != nil {
                if saved {
                    Text(L10n.savedTitle).foregroundColor(.green).bold()
                } else {
                    Button(action: { save(medication) }) {
                        if saving { ProgressView() } else { Text(L10n.saveToReminders) }
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

    @ViewBuilder
    private func layer1Content(_ response: Layer1Response) -> some View {
        if response.requires_tokens == true {
            VStack(spacing: 10) {
                Text(L10n.lockedTitle).font(.headline)
                Text(L10n.lockedBody).font(.subheadline).foregroundColor(.secondary).multilineTextAlignment(.center)
                Button(L10n.openAppButton, action: onOpenApp).buttonStyle(.borderedProminent)
            }
        } else {
            VStack(alignment: .leading, spacing: 8) {
                Text("\(L10n.categoryLabel): \(response.category)").font(.headline)
                if let summary = response.summary {
                    Text(summary).font(.subheadline).foregroundColor(.secondary)
                }
                if let contact = response.contact {
                    if let name = contact.name { Text("\(L10n.contactName): \(name)").font(.caption) }
                    if let phone = contact.phone { Text("\(L10n.contactPhone): \(phone)").font(.caption) }
                    if let company = contact.company { Text("\(L10n.contactCompany): \(company)").font(.caption) }
                }
                if let calendar = response.calendar {
                    if let title = calendar.title { Text("\(L10n.calendarTitle): \(title)").font(.caption) }
                    if let location = calendar.location { Text("\(L10n.calendarLocation): \(location)").font(.caption) }
                    if let start = calendar.start_date { Text("\(L10n.calendarStart): \(start)").font(.caption) }
                }
                // Saving to Contacts/Calendar from here is left to the main
                // app for this first pass (per session decision to keep
                // this to "show Layer 1's result", not rebuild the full
                // save flow natively too).
                Button(L10n.finishInAppButton, action: onOpenApp)
                    .buttonStyle(.borderedProminent)
                    .padding(.top, 4)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
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
