//
//  SensitiveCardDetector.swift
//  ShareExtension
//
//  Text-pattern payment-card detector — a stopgap for the Tier-0 "never
//  leaves the device" guarantee ImageClassifier.swift's Core ML model was
//  meant to provide (see the collaborator's spikes/s3-l1-vision-classifier/
//  README — that model is still under-trained, per the main session's
//  notes). This runs on whatever OCR text TextRecognizer.swift already
//  produced — no image classification needed — and is mirrored 1:1 in
//  apps/expo/src/layer0/sensitiveCard.ts and backend/app/sensitive_content.py.
//
//  Two independent signals, either one blocks:
//    1. A Luhn-valid 13-19 digit run -- real, unmasked card numbers pass
//       Luhn by construction; a phone number or receipt total practically
//       never does. Low false-positive rate on its own.
//    2. A card-brand keyword (VISA/MASTERCARD/...) together with an expiry
//       date/keyword -- catches a photo where the number OCR'd badly but
//       the rest of the card is legible. Requiring *both* keeps a receipt
//       that mentions "paid by Visa" from tripping this.
//
import Foundation

private let strongBrandKeywords = [
    "visa", "mastercard", "master card", "american express", "amex",
    "discover", "jcb", "unionpay", "diners club",
    "신용카드", "체크카드", "직불카드",
    "クレジットカード", "デビットカード",
    "信用卡", "借记卡",
]

private let expiryKeywords = ["good thru", "valid thru", "expires", "exp date", "유효기간", "만료일", "有効期限"]
private let expiryRegex = try! NSRegularExpression(pattern: "\\b(0[1-9]|1[0-2])\\s*/\\s*\\d{2}\\b")
private let digitRunRegex = try! NSRegularExpression(pattern: "(?:\\d[ -]?){13,19}")

private func luhnValid(_ digits: String) -> Bool {
    let chars = Array(digits)
    var total = 0
    let parity = chars.count % 2
    for (i, ch) in chars.enumerated() {
        var d = ch.wholeNumberValue ?? 0
        if i % 2 == parity {
            d *= 2
            if d > 9 { d -= 9 }
        }
        total += d
    }
    return total % 10 == 0
}

private func hasLuhnValidCardNumber(_ text: String) -> Bool {
    let range = NSRange(text.startIndex..., in: text)
    let matches = digitRunRegex.matches(in: text, range: range)
    for match in matches {
        guard let r = Range(match.range, in: text) else { continue }
        let digits = String(text[r]).filter { $0.isNumber }
        if digits.count >= 13 && digits.count <= 19 && luhnValid(digits) {
            return true
        }
    }
    return false
}

func looksLikePaymentCard(_ text: String) -> Bool {
    guard !text.isEmpty else { return false }
    if hasLuhnValidCardNumber(text) { return true }
    let lower = text.lowercased()
    let hasBrand = strongBrandKeywords.contains { lower.contains($0) }
    let range = NSRange(text.startIndex..., in: text)
    let hasExpiry = expiryRegex.firstMatch(in: text, range: range) != nil || expiryKeywords.contains { lower.contains($0) }
    return hasBrand && hasExpiry
}
