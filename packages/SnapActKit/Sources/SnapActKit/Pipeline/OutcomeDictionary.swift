import Foundation

/// The outcome as a dictionary, for crossing a language boundary.
///
/// This lives in the package rather than in the Expo bridge on purpose. The
/// bridge cannot be compiled on this machine — Xcode has the iOS SDK but not
/// the iOS platform, so there is no way to typecheck it here — and the risky
/// part of it was never the Expo plumbing but the hundred lines that read
/// this API. Here, `make build` and `make test` cover it.
///
/// The breakdown is kept intact. An ordering that arrives as
/// `["create_contact", "save_note"]` can only be agreed with, not reviewed,
/// and reviewing it is the entire reason for putting this in the app.
public extension PhotoPipeline.Outcome {
    /// - Parameter phase: `"fast"` before OCR, `"refined"` after.
    func asDictionary(phase: String) -> [String: Any] {
        var out: [String: Any] = [
            "phase": phase,
            "category": routing.category.rawValue,
            "score": routing.score,
            "margin": routing.margin,
            "source": routing.source.rawValue,
            "isUnknown": routing.isUnknown,
            "gateAllowsLocalProcessing": gate.allowsLocalProcessing,
            "gateModelAvailable": gate.modelAvailable,
            "categories": categories.map(\.rawValue),
            "explorationApplied": ranking.explorationApplied,
            "topClasses": routing.alternates.prefix(6).map {
                ["category": $0.category.rawValue, "score": $0.score, "isNegative": $0.isNegative]
            },
            "signals": [
                "aspectRatio": signals.aspectRatio,
                "isScreenshot": signals.isScreenshot,
                "hasDocumentEdges": signals.hasDocumentEdges,
                "hasText": signals.hasText,
            ],
            "actions": ranking.actions.enumerated().map { $1.asDictionary(position: $0 + 1) },
            "timings": [
                "gateMs": timings.gateMs,
                "signalsMs": timings.signalsMs,
                "routingMs": timings.routingMs,
                "rankingMs": timings.rankingMs,
                "ocrMs": timings.ocrMs,
                "arbitrationMs": timings.arbitrationMs,
                "totalMs": timings.totalMs,
            ],
        ]
        // Optionals are OMITTED, never inserted as `x as Any`. An
        // `Optional.none` boxed into `Any` does not survive the JS bridge
        // conversion, so writing it that way is a crash waiting for the first
        // photo that skips OCR.
        if let reason = routing.unknownReason {
            out["unknownReason"] = String(describing: reason)
        }
        if let promoted = ranking.promoted {
            out["promoted"] = promoted.rawValue
        }
        if let correction {
            out["correction"] = ["added": correction.added.map(\.rawValue),
                                 "outcome": String(describing: correction.outcome)]
        }
        if let ocr {
            out["ocr"] = ocr.asDictionary
        }
        return out
    }
}

public extension RankedAction {
    func asDictionary(position: Int) -> [String: Any] {
        var out: [String: Any] = [
            "position": position,
            "verb": verb.rawValue,
            "origin": candidate.origin.rawValue,
            "basePrior": candidate.basePrior,
            "impressions": counter.impressions,
            "clicks": counter.clicks,
            "smoothedRate": smoothedRate,
            "contextBoost": contextBoost,
            "profileBoost": profileBoost,
            "score": score,
            "naturalRank": naturalRank,
        ]
        if let display = candidate.display { out["display"] = display }
        if let slotScore = candidate.slotScore { out["slotScore"] = slotScore }
        return out
    }
}

public extension TextReadResult {
    var asDictionary: [String: Any] {
        var out: [String: Any] = [
            "performed": didRun,
            "durationMs": durationMs,
            "spanCount": spans.count,
            "characterCount": totalCharacters,
            // Carried out for on-screen review only. InteractionLog records
            // the LENGTH and never this, because it is somebody's address.
            "text": spans.map(\.text).joined(separator: "\n"),
        ]
        if let plan {
            out["languages"] = plan.languages
            out["level"] = plan.level.rawValue
            out["droppedLanguages"] = plan.dropped
        }
        if let skipped {
            out["skipped"] = String(describing: skipped)
        }
        return out
    }
}

public extension PhotoPipeline {
    /// What is configured and what is not.
    ///
    /// Worth a place on any test screen: with thresholds still null every
    /// photo comes back `unknown`, and a build that is merely unfinished
    /// looks broken.
    static func diagnosticsDictionary(counterStoreShared: Bool) -> [String: Any] {
        var out: [String: Any] = ["counterStoreShared": counterStoreShared]
        if let routing = try? RoutingConfig.load() {
            out["thresholdsConfigured"] = routing.thresholds.isConfigured
            out["prefilterEnabled"] = routing.prefilter.enabled
            if let minScore = routing.thresholds.minScore { out["minScore"] = minScore }
            if let minMargin = routing.thresholds.minMargin { out["minMargin"] = minMargin }
            if let confidence = routing.prefilter.minConfidence {
                out["prefilterMinConfidence"] = confidence
            }
            out["unconfigured"] = routing.unconfigured
                + ((try? RankingConfig.load())?.unconfiguredBoosts ?? [])
        } else {
            out["unconfigured"] = [String]()
            out["configError"] = "routing_config.json 로드 실패 — 탐색한 번들: "
                + ResourceBundle.searchedDescription
        }
        out["foundationModels"] = arbiterAvailabilityDescription
        return out
    }

    /// Why arbitration will or will not run, in words fit for a screen.
    static var arbiterAvailabilityDescription: String {
        if #available(iOS 26, macOS 26, *) {
            return FoundationModelsArbiter.availabilityDescription
        }
        return "이 OS 에 없음 (iOS 26 / macOS 26 이상 필요)"
    }
}
