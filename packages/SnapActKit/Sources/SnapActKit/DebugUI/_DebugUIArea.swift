// DebugUI/ — the review screen (step 12).
//
// Lives in the library, not in the executable, so the same SwiftUI view runs
// under `swift run` on macOS today and drops into the partner's iOS app
// unchanged. Sources/SnapActDebugApp is only a host window.
//
// Its purpose is reviewing WHY an ordering happened: per-action basePrior,
// clicks, impressions, smoothedRate, contextBoost and final score, plus
// whether exploration fired. A screen that shows only the final order cannot
// be reviewed, it can only be agreed with.
