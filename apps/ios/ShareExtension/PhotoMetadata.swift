//
//  PhotoMetadata.swift
//  ShareExtension
//
//  Swift counterpart to apps/expo/src/layer0/metadata.ts — same scope, same
//  reasoning: EXIF can't tell you WHAT a photo shows, only whether it came
//  off a real camera sensor (Make/Model present) vs. a screenshot or a
//  re-saved/downloaded image (those almost always have it stripped). A
//  supplementary confidence nudge, never the classifier itself.
//
//  Uses ImageIO directly on the raw image data the extension already has
//  from NSItemProvider — no Photos library permission needed, unlike
//  PHAsset-based metadata (mediaSubtypes' .screenshot flag, etc.), which
//  isn't available here since the extension doesn't necessarily get a
//  PHAsset reference for a shared image.
//
import ImageIO
import Foundation

struct PhotoMetadata {
    let hasCameraExif: Bool
}

func extractPhotoMetadata(from imageData: Data) -> PhotoMetadata {
    guard
        let source = CGImageSourceCreateWithData(imageData as CFData, nil),
        let properties = CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any]
    else {
        return PhotoMetadata(hasCameraExif: false)
    }

    let tiff = properties[kCGImagePropertyTIFFDictionary] as? [CFString: Any]
    let hasMake = (tiff?[kCGImagePropertyTIFFMake] as? String)?.isEmpty == false
    let hasModel = (tiff?[kCGImagePropertyTIFFModel] as? String)?.isEmpty == false
    return PhotoMetadata(hasCameraExif: hasMake || hasModel)
}

// Mirrors apps/expo/src/layer0/metadata.ts's applyMetadataNudge exactly —
// keep both in sync.
private let cameraLikelyCategories: Set<Category> = [.businessCard, .medication]

func applyMetadataNudge(category: Category, confidence: Double, metadata: PhotoMetadata?) -> Double {
    guard let metadata = metadata, metadata.hasCameraExif, cameraLikelyCategories.contains(category) else {
        return confidence
    }
    return min(0.95, confidence + 0.05)
}
