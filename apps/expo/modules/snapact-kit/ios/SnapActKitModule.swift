import ExpoModulesCore
import SnapActKit

/// Exposes SnapActKit to JS.
///
/// Deliberately nothing but Expo plumbing. This file cannot be compiled on a
/// machine whose Xcode has no iOS platform — `xcodebuild` answers "Found no
/// destinations" for every iOS scheme — so anything it owned outright would
/// reach a device untested. The work lives in `PhotoReviewSession`, where
/// `make test` runs it; what remains here is name-for-name the shape of
/// modules/coreml-classify, which is known to link.
public final class SnapActKitModule: Module {
    private let session = PhotoReviewSession()

    public func definition() -> ModuleDefinition {
        Name("SnapActKit")

        AsyncFunction("analyze") { (uri: String, profile: [String]?) -> [String: Any] in
            try await self.session.analyzeDictionary(uri: uri, profile: profile ?? [])
        }

        // Records the tap and performs nothing. Executing actions is a later
        // session, and no code path here reaches Contacts or EventKit.
        AsyncFunction("recordChoice") { (verb: String) -> Bool in
            self.session.recordChoice(verb: verb)
        }

        AsyncFunction("resetCounters") { () -> Bool in
            self.session.reset()
            return true
        }

        AsyncFunction("exportLog") { () -> String in
            self.session.exportLogJSONL()
        }

        Function("diagnostics") { () -> [String: Any] in
            self.session.diagnosticsDictionary()
        }
    }
}
