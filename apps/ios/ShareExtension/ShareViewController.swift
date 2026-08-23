//
//  ShareViewController.swift
//  ShareExtension
//
//  Extension entry point: Photos' Share sheet -> Snapsist hands the shared
//  image straight to this controller. No RN, no JS runtime — this is the
//  whole point of splitting the extension out (see the architecture
//  discussion this session landed on: strict memory ceiling + no bridge to
//  Foundation Models pushed this out of Expo/RN).
//
import UIKit
import SwiftUI
import UniformTypeIdentifiers

class ShareViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        loadSharedImage()
    }

    private func loadSharedImage() {
        guard
            let item = extensionContext?.inputItems.first as? NSExtensionItem,
            let provider = item.attachments?.first(where: { $0.hasItemConformingToTypeIdentifier(UTType.image.identifier) })
        else {
            close()
            return
        }

        provider.loadItem(forTypeIdentifier: UTType.image.identifier, options: nil) { [weak self] item, _ in
            guard let self = self else { return }
            let image: UIImage?
            switch item {
            case let url as URL:
                image = (try? Data(contentsOf: url)).flatMap(UIImage.init(data:))
            case let img as UIImage:
                image = img
            case let data as Data:
                image = UIImage(data: data)
            default:
                image = nil
            }

            DispatchQueue.main.async {
                guard let image = image else {
                    self.close()
                    return
                }
                self.presentResult(for: image)
            }
        }
    }

    private func presentResult(for image: UIImage) {
        let hosting = UIHostingController(rootView: ShareResultView(
            image: image,
            onDone: { [weak self] in self?.close() },
            onOpenApp: { [weak self] in self?.openMainApp() }
        ))
        addChild(hosting)
        hosting.view.frame = view.bounds
        hosting.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(hosting.view)
        hosting.didMove(toParent: self)
    }

    // The main app (apps/expo) already registers the "snapsist" URL scheme
    // (app.json's "scheme") for expo-share-intent's own flow — reusing it
    // here means "needs Layer 1" photos still open straight into the app
    // instead of dead-ending in the share sheet.
    private func openMainApp() {
        guard let url = URL(string: "snapsist://") else {
            close()
            return
        }
        var responder: UIResponder? = self
        while let current = responder {
            if let application = current as? UIApplication {
                application.perform(#selector(UIApplication.open(_:options:completionHandler:)), with: url, with: nil)
                break
            }
            responder = current.next
        }
        close()
    }

    private func close() {
        extensionContext?.completeRequest(returningItems: nil, completionHandler: nil)
    }
}
