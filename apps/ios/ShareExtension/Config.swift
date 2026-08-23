//
//  Config.swift
//  ShareExtension
//
//  Mirrors apps/expo/src/config.ts — keep both in sync. API_KEY isn't a
//  true secret (same comment applies as backend/app/main.py's: it ships
//  inside the public app bundle either way), so hardcoding the same value
//  here is consistent with how the RN app already does it.
//
import Foundation

enum Config {
    static let apiBaseURL = "https://snapact-production.up.railway.app"
    static let apiKey = "5GpJo9PcN9KG2nrBpFxygyXlb2-hkcvW"
}
