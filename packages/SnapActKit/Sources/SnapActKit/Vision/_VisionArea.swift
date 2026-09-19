// Vision/ — CLIP embedding, prefilter, structural signals (steps 6-7).
//
// Pipeline order here is deliberate and measured, not stylistic:
//
//   VNClassifyImageRequest prefilter  — food/animal/scenery/person short-
//     circuits to unknown without paying for CLIP at all
//   CGImageSourceCreateThumbnailAtIndex — never a full-resolution decode; in
//     a Share Extension that hits the memory cap and dies silently
//     (docs/future-plan/rules/ios-platform.md)
//   256x256 CVPixelBuffer -> mobileclip_s0_image -> final_emb_1 [1, 512]
//   L2 normalise -> cosine against class_embeddings.json
//   structural-signal reweighting -> category
//
// Do NOT normalise pixel values in Swift. The .mlpackage input is an
// imageType and the scaling is inside the graph — verified: the first op
// after `image` is a multiply by 0.00392156886 (= 1/255). Doing it again
// raises no error and silently degrades accuracy, which is close to
// undiagnosable after the fact.
//
// VNImageRequestHandler.perform(_:) is synchronous — never on the main queue.
