import Foundation

/// The context a photo was shared in, as ranking sees it.
///
/// Buckets rather than raw values: an exact timestamp is identifying, and the
/// interaction log stores this. "Evening, weekend, shared three seconds after
/// capture" is what changes the ordering anyway.
public struct ActionContext: Sendable, Equatable {
    public let hourBucket: HourBucket
    public let isWeekend: Bool
    public let captureDelay: CaptureDelay
    public let isScreenshot: Bool
    /// Chosen once during onboarding. Keys into ranking_config profileBoosts.
    public let profile: [String]

    public init(hourBucket: HourBucket, isWeekend: Bool, captureDelay: CaptureDelay,
                isScreenshot: Bool = false, profile: [String] = []) {
        self.hourBucket = hourBucket
        self.isWeekend = isWeekend
        self.captureDelay = captureDelay
        self.isScreenshot = isScreenshot
        self.profile = profile
    }

    public enum HourBucket: String, Sendable, Codable {
        case morning, afternoon, evening, night

        public init(hour: Int) {
            switch hour {
            case 5 ..< 12: self = .morning
            case 12 ..< 18: self = .afternoon
            case 18 ..< 23: self = .evening
            default: self = .night
            }
        }
    }

    /// Time between taking the photo and sharing it. Three seconds means the
    /// user is doing something right now; three months means they are tidying
    /// the camera roll and the intent is unclear.
    public enum CaptureDelay: String, Sendable, Codable {
        case justNow, recent, longAgo

        public init(seconds: TimeInterval) {
            switch seconds {
            case ..<60: self = .justNow
            case ..<(60 * 60 * 24 * 7): self = .recent
            default: self = .longAgo
            }
        }
    }

    public static func now(profile: [String] = [], captureDelay: CaptureDelay = .recent,
                           isScreenshot: Bool = false,
                           calendar: Calendar = .current, date: Date = Date()) -> ActionContext {
        ActionContext(hourBucket: HourBucket(hour: calendar.component(.hour, from: date)),
                      isWeekend: calendar.isDateInWeekend(date),
                      captureDelay: captureDelay, isScreenshot: isScreenshot, profile: profile)
    }
}

/// One ranked button, with its score broken into the parts that produced it.
///
/// The breakdown is not debug decoration — a screen that shows only the final
/// order cannot be reviewed, only agreed with.
public struct RankedAction: Sendable, Equatable {
    public let candidate: ActionCandidate
    public let counter: ActionCounter
    public let smoothedRate: Double
    public let contextBoost: Double
    public let profileBoost: Double
    public let score: Double
    /// Rank before exploration moved anything, 1-based.
    public let naturalRank: Int

    public var verb: VerbID { candidate.verb }
}

public struct RankingOutcome: Sendable {
    public let actions: [RankedAction]
    public let explorationApplied: Bool
    /// Which verb exploration promoted, when it did.
    public let promoted: VerbID?
}

/// Scores candidates and orders them.
///
/// Ranking only reorders. It never removes a candidate, so a wrong inference
/// costs position rather than availability — the option moves down, it does
/// not disappear.
public struct BayesianRanker: Sendable {
    private let config: RankingConfig
    private let store: any ActionCounterStore

    public init(config: RankingConfig, store: any ActionCounterStore) {
        self.config = config
        self.store = store
    }

    /// (clicks + alpha * basePrior) / (impressions + alpha)
    ///
    /// With no history this is exactly basePrior, so a first-time user gets
    /// the spreadsheet's intended order rather than an arbitrary one. Alpha is
    /// how much evidence it takes to overturn that.
    public func smoothedRate(_ counter: ActionCounter, basePrior: Double) -> Double {
        let alpha = config.smoothing.alpha
        return (Double(counter.clicks) + alpha * basePrior) / (Double(counter.impressions) + alpha)
    }

    public func rank(_ candidates: [ActionCandidate],
                     category: CategoryID,
                     context: ActionContext,
                     randomness: RandomNumberGenerator & Sendable = SystemRandomNumberGenerator())
    -> RankingOutcome {
        var generator = randomness

        let scored = candidates.map { candidate -> RankedAction in
            let counter = store.counter(category: category, verb: candidate.verb)
            let rate = smoothedRate(counter, basePrior: candidate.basePrior)
            let contextBoost = self.contextBoost(for: candidate.verb, context: context)
            let profileBoost = self.profileBoost(for: candidate.verb, context: context)
            return RankedAction(candidate: candidate, counter: counter, smoothedRate: rate,
                                contextBoost: contextBoost, profileBoost: profileBoost,
                                score: rate * contextBoost * profileBoost, naturalRank: 0)
        }
        .sorted { $0.score > $1.score }
        .enumerated()
        .map { index, action in
            RankedAction(candidate: action.candidate, counter: action.counter,
                         smoothedRate: action.smoothedRate, contextBoost: action.contextBoost,
                         profileBoost: action.profileBoost, score: action.score,
                         naturalRank: index + 1)
        }

        return explore(scored, using: &generator)
    }

    /// Swaps one of the top positions with a lower-ranked candidate, sometimes.
    ///
    /// Without this, only the top few are ever shown, only the shown are ever
    /// clicked, and the counters confirm whatever the priors happened to say.
    /// Personalisation would be frozen at its starting order forever, and that
    /// failure is invisible: the numbers all look like agreement.
    func explore(_ actions: [RankedAction],
                 using generator: inout some RandomNumberGenerator) -> RankingOutcome {
        let settings = config.exploration
        guard settings.probability > 0,
              Double.random(in: 0 ..< 1, using: &generator) < settings.probability else {
            return RankingOutcome(actions: actions, explorationApplied: false, promoted: nil)
        }

        let poolLower = max(settings.topK, settings.poolStart - 1)   // 0-based
        let poolUpper = min(actions.count, settings.poolEnd)
        guard actions.count > settings.topK, poolLower < poolUpper else {
            return RankingOutcome(actions: actions, explorationApplied: false, promoted: nil)
        }

        let target = Int.random(in: 0 ..< min(settings.topK, actions.count), using: &generator)
        let source = Int.random(in: poolLower ..< poolUpper, using: &generator)

        var reordered = actions
        reordered.swapAt(target, source)
        return RankingOutcome(actions: reordered, explorationApplied: true,
                              promoted: actions[source].verb)
    }

    // MARK: - Boosts

    func contextBoost(for verb: VerbID, context: ActionContext) -> Double {
        var boost = 1.0
        func apply(_ key: String) {
            guard let rule = config.contextBoosts[key], let value = rule.boost,
                  rule.verbs.contains(verb) else { return }
            boost *= value
        }
        if !context.isWeekend, context.hourBucket == .afternoon || context.hourBucket == .morning {
            apply("weekdayDaytime")
        }
        if context.isWeekend, context.hourBucket == .evening { apply("weekendEvening") }
        switch context.captureDelay {
        case .justNow: apply("capturedJustNow")
        case .longAgo: apply("capturedLongAgo")
        case .recent: break
        }
        if context.isScreenshot { apply("screenshot") }
        return boost
    }

    func profileBoost(for verb: VerbID, context: ActionContext) -> Double {
        var boost = 1.0
        for key in context.profile {
            guard let rule = config.profileBoosts[key], let value = rule.boost,
                  rule.verbs.contains(verb) else { continue }
            boost *= value
        }
        return boost
    }
}
