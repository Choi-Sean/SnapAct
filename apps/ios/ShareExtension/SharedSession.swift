//
//  SharedSession.swift
//  ShareExtension
//
//  Reads the signed-in session token that apps/expo/src/auth.ts wrote via
//  expo-secure-store (Keychain), so a logged-in user's token balance and
//  history still apply when a Layer 1 call happens from the extension
//  instead of the main app.
//
//  REQUIRES a one-time Xcode setup step neither compiler nor I can verify
//  here: both the main app target and this extension target need the same
//  "Keychain Sharing" entitlement / access group (e.g. group
//  "$(AppIdentifierPrefix)com.snapact.app"), or SecItemCopyMatching below
//  will just return errSecItemNotFound even when the main app has a valid
//  session — different bundle IDs are sandboxed from each other's Keychain
//  by default. See apps/ios/SETUP.md.
//
//  The query below matches expo-secure-store's exact storage scheme (see
//  apps/expo/node_modules/expo-secure-store/ios/SecureStoreModule.swift):
//  kSecClassGenericPassword, service "app:no-auth" (no keychainService /
//  requireAuthentication option passed from auth.ts, so both default),
//  kSecAttrGeneric/kSecAttrAccount both set to the raw UTF-8 key bytes.
//
import Foundation

private let sessionKey = "snapsist_session"
private let keychainService = "app:no-auth"

struct Session: Decodable {
    let token: String
    let email: String
    let token_balance: Int
}

func loadSharedSession() -> Session? {
    let keyData = Data(sessionKey.utf8)
    let query: [String: Any] = [
        kSecClass as String: kSecClassGenericPassword,
        kSecAttrService as String: keychainService,
        kSecAttrGeneric as String: keyData,
        kSecAttrAccount as String: keyData,
        kSecReturnData as String: true,
        kSecMatchLimit as String: kSecMatchLimitOne,
    ]

    var item: CFTypeRef?
    let status = SecItemCopyMatching(query as CFDictionary, &item)
    guard status == errSecSuccess, let data = item as? Data else { return nil }
    return try? JSONDecoder().decode(Session.self, from: data)
}
