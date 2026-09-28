import SwiftUI
import SnapActKit

#if canImport(AppKit)
import AppKit
#endif

/// macOS host for `DebugRootView`.
///
/// This target is a window and nothing else — every reviewable behaviour lives
/// in SnapActKit so the partner can host the same view from the iOS app.
///
/// The file is not named main.swift on purpose: SPM treats that name as
/// top-level code, which cannot coexist with @main.
@main
struct SnapActDebugApp: App {
    #if canImport(AppKit)
    @NSApplicationDelegateAdaptor(AppDelegate.self) private var delegate
    #endif

    var body: some Scene {
        WindowGroup("SnapAct Debug") {
            DebugRootView()
        }
    }
}

#if canImport(AppKit)
/// Launched by `swift run`, the process has no app bundle, so AppKit leaves it
/// as an accessory with no Dock presence and no focused window. Promoting it to
/// .regular is what makes the window actually appear in front.
final class AppDelegate: NSObject, NSApplicationDelegate {
    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.regular)
        NSApp.activate(ignoringOtherApps: true)
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        true
    }
}
#endif
