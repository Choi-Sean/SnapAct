// OCR/ — text extraction, text only (step 8).
//
// Scope stops at spans. No field extraction (L3) in this session.
//
// The spec is configuration, not code: which classes need OCR at all, which
// languages to enable (never all of them), region of interest, minimum text
// height, and recognition level. Results stay as spans — text plus bounding
// box plus confidence — because flattening to a single string throws away
// exactly what later arbitration and source-span grounding need.
//
// supportedRecognitionLanguages(for:revision:) is queried at runtime. Apple's
// own documentation has been wrong about language support before, so an
// unsupported language disables that path rather than being assumed present.
