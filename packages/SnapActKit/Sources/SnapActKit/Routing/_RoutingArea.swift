// Routing/ — category decision (step 6).
//
// PhotoRouter protocol + implementations. Open question raised before this
// step: FoundationModels takes no image input (verified against
// iPhoneOS26.5.sdk — PromptRepresentable is String/Prompt/Array/@Generable
// only), and pipeline.md puts the router at VIS before OCR with L5 after it.
// The routing backend is therefore still being decided; the protocol is what
// keeps that decision swappable.
