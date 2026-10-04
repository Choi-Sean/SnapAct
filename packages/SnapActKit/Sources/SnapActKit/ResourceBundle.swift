import Foundation

/// Finds the bundled resources under either build system.
///
/// The package is consumed two ways and they disagree about where resources
/// live. SPM generates `Bundle.module`; CocoaPods — which Expo's prebuild
/// uses — copies `s.resources` into the app bundle instead. Referencing
/// `Bundle.module` unconditionally simply fails to compile under CocoaPods,
/// since SPM is what synthesises it.
///
/// So the candidates are tried in order, the same way
/// apps/expo/modules/coreml-classify already locates its model. Order matters
/// only for speed; a resource name appears in exactly one of them.
public enum ResourceBundle {
    /// Marker class used to locate the framework/pod bundle this code shipped
    /// in. A type from this module is the only reliable handle on it.
    private final class Marker {}

    /// Nested resource bundles to look inside, if the pod is ever switched
    /// from `s.resources` to `s.resource_bundles` — which nests one level
    /// deeper and would otherwise silently find nothing.
    private static let nestedBundleNames = ["SnapActKit", "SnapActKitBridge"]

    static var candidates: [Bundle] {
        var bundles: [Bundle] = []
        #if SWIFT_PACKAGE
        // Defined by SPM only. Guarding on it is what lets one file serve both.
        bundles.append(.module)
        #endif
        bundles.append(Bundle(for: Marker.self))
        bundles.append(.main)

        for bundle in bundles {
            for name in nestedBundleNames {
                if let url = bundle.url(forResource: name, withExtension: "bundle"),
                   let nested = Bundle(url: url) {
                    bundles.append(nested)
                }
            }
        }
        return bundles
    }

    static func url(forResource name: String, withExtension ext: String) -> URL? {
        for bundle in candidates {
            if let url = bundle.url(forResource: name, withExtension: ext) { return url }
        }
        return nil
    }

    /// Names every place that was searched, for an error message worth reading
    /// — "actions.json is missing" is useless without knowing where it looked.
    public static var searchedDescription: String {
        candidates.map { $0.bundleURL.lastPathComponent }.joined(separator: ", ")
    }
}
