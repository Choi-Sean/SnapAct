//
//  MedicationExtractor.swift
//  ShareExtension
//
//  LAYER 0 — on-device medication field extraction, Swift port of
//  apps/expo/src/layer0/medicationExtract.ts. Regex/keyword based, not an
//  LLM (Foundation Models needs iOS 26 + Apple Intelligence hardware — not
//  universal, so it isn't relied on here yet). This is the tradeoff that
//  keeps a medication photo from ever leaving the device: it will miss
//  things a cloud LLM would catch, and that's accepted for this category.
//
import Foundation

enum MealRelation: String {
    case beforeMeal = "before_meal"
    case afterMeal = "after_meal"
    case withMeal = "with_meal"
    case unspecified
}

struct MedicationPayload {
    var name: String?
    var dosage: String?
    var timesPerDay: Int?
    var durationDays: Int?
    var relationToMeal: MealRelation
    var specificTimes: [String]?
}

// All 7 supported languages — mirrors classify.ts's medication keyword list,
// split by meal-timing meaning instead of flat classification keywords.
private let mealKeywords: (before: [String], after: [String], with: [String]) = (
    before: ["before meals", "before meal", "식전", "食前", "饭前", "餐前", "antes de las comidas", "antes de comer", "avant les repas", "vor den mahlzeiten"],
    after: ["after meals", "after meal", "식후30분", "식후 30분", "식후", "食後", "饭后", "餐后", "después de las comidas", "después de comer", "après les repas", "nach den mahlzeiten"],
    with: ["with meals", "with food", "식사와 함께", "식사 중", "食事と一緒に", "食事中", "随餐", "与餐同服", "con las comidas", "con la comida", "avec les repas", "zu den mahlzeiten", "mit dem essen"]
)

private let dosageRegex = try! NSRegularExpression(pattern: "(\\d+(?:[.,]\\d+)?\\s?(?:mg|mcg|ml|g|iu))\\b|(\\d+\\s?(?:정|캡슐|錠|カプセル|片|粒|胶囊|膠囊))", options: .caseInsensitive)
private let frequencyRegex = try! NSRegularExpression(pattern: "(\\d+)\\s*(?:times a day|times daily|회|回|次|veces al día|fois par jour|mal täglich)", options: .caseInsensitive)
// Tried in order (see extractMedication below): the specific-suffix
// pattern first, so "7일분" (duration) doesn't lose to an earlier,
// unrelated "1일 3회" (frequency) in the same text matching the bare
// "일"/"日"/"天" fallback instead.
private let durationSpecificRegex = try! NSRegularExpression(pattern: "(\\d+)\\s*(?:days?|일분|일치|일간|日分|日間|días?|jours?|tage)\\b", options: .caseInsensitive)
private let durationBareRegex = try! NSRegularExpression(pattern: "(\\d+)\\s*(?:일|日|天)\\b", options: .caseInsensitive)
private let hhmmRegex = try! NSRegularExpression(pattern: "\\b([01]?\\d|2[0-3]):([0-5]\\d)\\b")
private let koreanAmpmRegex = try! NSRegularExpression(pattern: "(오전|오후)\\s*(\\d{1,2})\\s*시")

private func firstMatch(_ regex: NSRegularExpression, in text: String, group: Int = 1) -> String? {
    let ns = text as NSString
    guard let match = regex.firstMatch(in: text, range: NSRange(location: 0, length: ns.length)) else { return nil }
    // Two-alternative dosage pattern: whichever group matched.
    for g in stride(from: group, through: match.numberOfRanges - 1, by: 1) {
        let range = match.range(at: g)
        if range.location != NSNotFound {
            return ns.substring(with: range).trimmingCharacters(in: .whitespaces)
        }
    }
    return nil
}

private func detectMealRelation(_ haystack: String) -> MealRelation {
    if mealKeywords.after.contains(where: haystack.contains) { return .afterMeal }
    if mealKeywords.before.contains(where: haystack.contains) { return .beforeMeal }
    if mealKeywords.with.contains(where: haystack.contains) { return .withMeal }
    return .unspecified
}

private func extractSpecificTimes(_ rawText: String) -> [String] {
    var times: [String] = []
    let ns = rawText as NSString

    hhmmRegex.enumerateMatches(in: rawText, range: NSRange(location: 0, length: ns.length)) { match, _, _ in
        guard let match = match else { return }
        let hour = ns.substring(with: match.range(at: 1))
        let minute = ns.substring(with: match.range(at: 2))
        times.append(String(format: "%02d:%@", Int(hour) ?? 0, minute))
    }

    koreanAmpmRegex.enumerateMatches(in: rawText, range: NSRange(location: 0, length: ns.length)) { match, _, _ in
        guard let match = match else { return }
        let ampm = ns.substring(with: match.range(at: 1))
        var hour = (Int(ns.substring(with: match.range(at: 2))) ?? 0) % 12
        if ampm == "오후" { hour += 12 }
        times.append(String(format: "%02d:00", hour))
    }

    var seen = Set<String>()
    return times.filter { seen.insert($0).inserted }
}

// First non-empty OCR line — a rough stand-in for "the medication name,"
// same limitation as the TS version: no on-device LLM to actually identify
// it as a name.
private func guessName(_ rawText: String) -> String? {
    guard let line = rawText
        .split(separator: "\n")
        .map({ $0.trimmingCharacters(in: .whitespaces) })
        .first(where: { $0.count >= 2 })
    else { return nil }
    return line.count > 40 ? String(line.prefix(40)) : line
}

func extractMedication(_ rawText: String) -> MedicationPayload {
    let haystack = rawText.lowercased()
    let specificTimes = extractSpecificTimes(rawText)
    let frequencyMatch = firstMatch(frequencyRegex, in: haystack)
    let durationMatch = firstMatch(durationSpecificRegex, in: haystack) ?? firstMatch(durationBareRegex, in: haystack)

    return MedicationPayload(
        name: guessName(rawText),
        dosage: firstMatch(dosageRegex, in: rawText),
        timesPerDay: frequencyMatch.flatMap(Int.init) ?? (specificTimes.isEmpty ? nil : specificTimes.count),
        durationDays: durationMatch.flatMap(Int.init),
        relationToMeal: detectMealRelation(haystack),
        specificTimes: specificTimes.isEmpty ? nil : specificTimes
    )
}
