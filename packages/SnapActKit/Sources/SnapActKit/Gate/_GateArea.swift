// Gate/ — Tier 0 blocking gate (step 4).
//
// Stub this session: the classifier is still being trained in training/.
// The interface ships now anyway so that the upload path cannot be built
// before the gate works — UploadableImage is unconstructible while the model
// is unavailable, which makes a premature upload a compile-time failure
// rather than a leak.
//
// Note on ordering: privacy.md puts the gate at the very front, before OCR
// and before any upload. The stub returning .allowed does not change where it
// belongs in the call sequence, so the pipeline calls it first regardless —
// otherwise landing the real model would mean reordering the pipeline under
// code that already assumed the old order.
