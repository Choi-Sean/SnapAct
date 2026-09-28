// Logging/ — interaction log schema and local store (step 11).
//
// Records every action SHOWN, not only the one chosen: a click-only log
// cannot express "offered and declined", which is most of the signal.
//
// Never logged: the photo, and the CONTENT of OCR text or any extracted
// field. Only whether a signal was present, and lengths. The 512-dim
// embedding is kept — it is the training set for the eventual own-head
// router, and a period without it is a period lost for good.
//
// Local JSONL. Nothing leaves the device.
