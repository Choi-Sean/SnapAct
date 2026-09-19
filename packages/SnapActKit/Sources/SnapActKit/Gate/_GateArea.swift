// Gate/ — Tier 0 blocking gate (step 4).
//
// Stub this session: the classifier is still being trained in training/.
// The interface ships now anyway so that the upload path cannot be built
// before the gate works — UploadableImage is unconstructible while the model
// is unavailable, which makes a premature upload a compile-time failure
// rather than a leak.
