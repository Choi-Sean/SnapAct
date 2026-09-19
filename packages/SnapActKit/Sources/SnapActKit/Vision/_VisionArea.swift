// Vision/ — image embedding extraction (step 5).
//
// VNGenerateImageFeaturePrintRequest, downsampled to 512px on the long edge.
// The embedding is written to the interaction log and is NOT used for this
// session's routing decision: it is training data for the eventual own-head
// router, and a period where we did not collect it is a period lost for good.
//
// VNImageRequestHandler.perform(_:) is synchronous — never call it on the
// main queue (docs/future-plan/rules/ios-platform.md).
