//
//  MedicationReminderSaver.swift
//  ShareExtension
//
//  Saves a resolved medication result to the iOS Reminders app via
//  EventKit — same target (Reminders, not raw local notifications) and
//  same daily-recurrence-for-N-days shape as
//  apps/expo/src/nativeActions.ts's saveMedicationReminders(), so a
//  medication photo produces the same result whether it went through the
//  main RN app or straight through this Share Extension.
//
import EventKit
import Foundation

enum ReminderSaveError: Error {
    case accessDenied
    case noWritableCalendar
}

private func requestReminderAccess(_ store: EKEventStore) async throws {
    if #available(iOS 17.0, *) {
        guard try await store.requestFullAccessToReminders() else {
            throw ReminderSaveError.accessDenied
        }
    } else {
        let granted = await withCheckedContinuation { continuation in
            store.requestAccess(to: .reminder) { granted, _ in continuation.resume(returning: granted) }
        }
        guard granted else { throw ReminderSaveError.accessDenied }
    }
}

private func writableCalendar(_ store: EKEventStore) throws -> EKCalendar {
    if let calendar = store.defaultCalendarForNewReminders() {
        return calendar
    }
    guard let calendar = store.calendars(for: .reminder).first(where: { $0.allowsContentModifications }) else {
        throw ReminderSaveError.noWritableCalendar
    }
    return calendar
}

// Builds one daily-recurring reminder per dose time, titled from the
// medication name (with a "(dose N of M)" suffix when there's more than
// one time per day — matching AnalyzeScreen.tsx's buildMedicationSlots).
func saveMedicationReminders(_ medication: MedicationPayload, durationDays: Int, fallbackName: String) async throws {
    let store = EKEventStore()
    try await requestReminderAccess(store)
    let calendar = try writableCalendar(store)

    let name = medication.name ?? fallbackName
    var noteParts: [String] = []
    if let dosage = medication.dosage { noteParts.append(dosage) }
    noteParts.append(mealRelationLabel(medication.relationToMeal))
    let notes = noteParts.joined(separator: " · ")

    let times: [(hour: Int, minute: Int)]
    if let specific = medication.specificTimes, !specific.isEmpty {
        times = specific.compactMap { hhmm in
            let parts = hhmm.split(separator: ":")
            guard parts.count == 2, let h = Int(parts[0]), let m = Int(parts[1]) else { return nil }
            return (h, m)
        }
    } else {
        // No times parsed off the label — default to a single mid-morning
        // dose; the user can adjust it in Reminders afterwards. The RN app
        // instead prompts a time picker (TimeConfirmModal) before saving;
        // the extension keeps this v1 non-interactive per the "3 seconds to
        // a card" goal and just picks a sane default.
        times = [(9, 0)]
    }

    for (index, time) in times.enumerated() {
        var start = Foundation.Calendar.current.dateComponents([.year, .month, .day], from: Date())
        start.hour = time.hour
        start.minute = time.minute
        guard var startDate = Foundation.Calendar.current.date(from: start) else { continue }
        if startDate < Date() {
            startDate = Foundation.Calendar.current.date(byAdding: .day, value: 1, to: startDate) ?? startDate
        }

        let reminder = EKReminder(eventStore: store)
        reminder.title = times.count > 1 ? "\(name) (\(index + 1)/\(times.count))" : name
        reminder.notes = notes.isEmpty ? nil : notes
        reminder.calendar = calendar
        reminder.dueDateComponents = Foundation.Calendar.current.dateComponents(
            [.year, .month, .day, .hour, .minute], from: startDate
        )
        reminder.addAlarm(EKAlarm(absoluteDate: startDate))
        reminder.recurrenceRules = [
            EKRecurrenceRule(recurrenceWith: .daily, interval: 1, end: EKRecurrenceEnd(occurrenceCount: max(1, durationDays)))
        ]

        try store.save(reminder, commit: false)
    }

    try store.commit()
}

// Matches apps/expo/src/i18n/dictionaries.ts's medicationTimingBeforeMeal /
// AfterMeal / WithMeal strings for the 7 supported locales — kept in sync
// manually since the extension can't import the RN dictionary directly.
private let mealRelationLabels: [String: [MealRelation: String]] = [
    "en": [.beforeMeal: "Before meals", .afterMeal: "After meals", .withMeal: "With meals"],
    "ko": [.beforeMeal: "식전", .afterMeal: "식후", .withMeal: "식사와 함께"],
    "ja": [.beforeMeal: "食前", .afterMeal: "食後", .withMeal: "食事と一緒に"],
    "zh": [.beforeMeal: "饭前", .afterMeal: "饭后", .withMeal: "随餐"],
    "es": [.beforeMeal: "Antes de las comidas", .afterMeal: "Después de las comidas", .withMeal: "Con las comidas"],
    "fr": [.beforeMeal: "Avant les repas", .afterMeal: "Après les repas", .withMeal: "Avec les repas"],
    "de": [.beforeMeal: "Vor den Mahlzeiten", .afterMeal: "Nach den Mahlzeiten", .withMeal: "Zu den Mahlzeiten"],
]

private func mealRelationLabel(_ relation: MealRelation) -> String {
    guard relation != .unspecified else { return "" }
    let lang = String(Locale.current.language.languageCode?.identifier ?? "en")
    let table = mealRelationLabels[lang] ?? mealRelationLabels["en"]!
    return table[relation] ?? ""
}
