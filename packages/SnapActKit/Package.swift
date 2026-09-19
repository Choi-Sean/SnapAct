// swift-tools-version: 6.2
import PackageDescription

// SnapActKit — photo -> category -> ranked action candidates.
//
// A package rather than files in an app target because both the app and the
// Share Extension need this code, and an extension cannot import an app
// target. It also means `swift test` and `swift run` exercise the whole thing
// on the host Mac: this branch has no Xcode project at all, and the partner's
// iOS work lives on main.
let package = Package(
    name: "SnapActKit",
    // FoundationModels (SystemLanguageModel, @Generable) is iOS 26 / macOS 26.
    platforms: [.iOS(.v26), .macOS(.v26)],
    products: [
        .library(name: "SnapActKit", targets: ["SnapActKit"]),
        .executable(name: "SnapActDebugApp", targets: ["SnapActDebugApp"]),
    ],
    targets: [
        .target(
            name: "SnapActKit",
            resources: [
                // .copy, not .process: an .mlpackage is a directory bundle and
                // has to reach the built product intact, to be compiled at
                // runtime via MLModel.compileModel(at:).
                //
                // Only the IMAGE encoder (22MB) is bundled. The text encoder
                // (81MB) is a build-time tool for generating class embeddings
                // and is neither shipped nor committed — see .gitignore.
                .copy("Resources/mobileclip_s0_image.mlpackage"),
                .process("Resources/class_embeddings.json"),
                .process("Resources/actions.json"),
            ]
        ),
        // The debug screen is a SwiftUI view inside SnapActKit/DebugUI, not
        // here: this target is only a host so `swift run` can show it on macOS.
        // The partner drops the same view into the iOS app unchanged.
        .executableTarget(name: "SnapActDebugApp", dependencies: ["SnapActKit"]),
        .testTarget(name: "SnapActKitTests", dependencies: ["SnapActKit"]),
    ]
)
