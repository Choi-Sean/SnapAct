// Routing/ — category decision (steps 7, 9).
//
// PhotoRouter is a protocol with two implementations this session: CLIPRouter,
// and a KNN stub kept deliberately empty. The stub is not decoration — if the
// Share Extension memory measurement rules CLIP out, KNN over stored
// embeddings is the replacement, and the seam has to already exist.
//
// The Foundation Models router is TEXT only. FoundationModels in the iOS 26
// SDK exposes no image input at all (PromptRepresentable is String / Prompt /
// Array / @Generable, with zero CGImage or CVPixelBuffer surface), so it runs
// on OCR output as an arbiter, never as the primary image classifier. That
// also matches docs/future-plan/rules/pipeline.md, which puts the vision
// router before OCR and the LLM after it.
