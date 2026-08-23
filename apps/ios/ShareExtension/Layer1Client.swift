//
//  Layer1Client.swift
//  ShareExtension
//
//  LAYER 1 (server) call — Swift port of apps/expo/src/api.ts's
//  analyzePhoto(), same backend/app/main.py's /analyze endpoint. Used when
//  LayerZeroAnalyzer.swift reports .needsLayer1 (business_card/receipt/
//  event_flyer — categories Layer 0 never attempts extraction for, see
//  backend/app/pricing.py's LAYER0_CATEGORIES).
//
import Foundation
import UIKit

struct ContactPayload: Decodable {
    let name: String?
    let phone: String?
    let email: String?
    let company: String?
}

struct CalendarPayload: Decodable {
    let title: String?
    let location: String?
    let start_date: String?
}

struct Layer1Response: Decodable {
    let mock: Bool
    let category: String
    let confidence: Double
    let suggested_action: String
    let contact: ContactPayload?
    let calendar: CalendarPayload?
    let requires_tokens: Bool?
    let summary: String?
}

enum Layer1Error: Error {
    case badResponse(Int, String)
    case noData
}

// Guest calls (no signed-in session) still work — they just always come
// back requires_tokens: true for non-Layer0 categories, same as the RN
// app's behavior for a logged-out user. See SharedSession.swift's header
// comment for the one-time Xcode setup this needs to see a real session.
func analyzeViaLayer1(_ image: UIImage) async throws -> Layer1Response {
    guard let jpegData = image.jpegData(compressionQuality: 0.7) else {
        throw Layer1Error.noData
    }

    let boundary = "Boundary-\(UUID().uuidString)"
    var request = URLRequest(url: URL(string: "\(Config.apiBaseURL)/analyze")!)
    request.httpMethod = "POST"
    request.setValue(Config.apiKey, forHTTPHeaderField: "X-API-Key")
    request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
    if let session = loadSharedSession() {
        request.setValue("Bearer \(session.token)", forHTTPHeaderField: "Authorization")
    }

    var body = Data()
    body.append("--\(boundary)\r\n".data(using: .utf8)!)
    body.append("Content-Disposition: form-data; name=\"file\"; filename=\"photo.jpg\"\r\n".data(using: .utf8)!)
    body.append("Content-Type: image/jpeg\r\n\r\n".data(using: .utf8)!)
    body.append(jpegData)
    body.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)
    request.httpBody = body

    let (data, response) = try await URLSession.shared.data(for: request)
    guard let http = response as? HTTPURLResponse else { throw Layer1Error.noData }
    guard (200..<300).contains(http.statusCode) else {
        let message = String(data: data, encoding: .utf8) ?? "HTTP \(http.statusCode)"
        throw Layer1Error.badResponse(http.statusCode, message)
    }

    return try JSONDecoder().decode(Layer1Response.self, from: data)
}
