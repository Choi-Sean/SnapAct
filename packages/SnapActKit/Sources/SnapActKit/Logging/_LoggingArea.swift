// Logging/ — interaction log schema and local store (step 8).
//
// Records every action SHOWN, not only the one chosen: a click-only log
// cannot express "offered and declined", which is most of the signal.
//
// Never logged: the photo, and the values of any extracted field. Only
// whether a signal was present. Local JSONL; nothing leaves the device.
