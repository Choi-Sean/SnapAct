import CoreGraphics
import Foundation
import ImageIO
import Vision

/// Cheap facts about a photo, gathered before CLIP and used to reweight it.
///
/// Everything here is either metadata or a fast Vision request. None of it
/// requires OCR, which is the expensive step — the point is to know something
/// useful before paying for anything.
public struct SignalExtractor: Sendable {
    /// Screen sizes that identify a screenshot when EXIF camera fields are
    /// also absent. Points, not pixels, so a Retina capture matches after
    /// dividing by its scale.
    ///
    /// Absence of camera metadata alone is not enough: a photo sent through a
    /// messenger arrives stripped of EXIF and would look identical.
    static let knownScreenAspectRatios: [Double] = [
        9.0 / 19.5,   // most modern iPhones
        9.0 / 16.0,   // older iPhones
        3.0 / 4.0,    // iPad portrait
        4.0 / 3.0,    // iPad landscape
        19.5 / 9.0,
        16.0 / 9.0,
    ]

    public init() {}

    /// Async because the Vision requests inside block. They run on
    /// VisionWork's queue — see VisionWork for why that is not optional.
    public func signals(for image: CGImage, sourceURL: URL? = nil) async -> SignalSet {
        let aspectRatio = Double(image.width) / Double(max(image.height, 1))
        return SignalSet(
            aspectRatio: aspectRatio,
            isScreenshot: Self.looksLikeScreenshot(aspectRatio: aspectRatio, url: sourceURL),
            hasDocumentEdges: await Self.hasDocumentEdges(image),
            hasText: (try? await TextReader.containsText(image)) ?? true
        )
    }

    /// EXIF camera fields absent AND the shape matches a device screen.
    ///
    /// Either test alone is wrong. A messenger strips EXIF from real photos,
    /// and plenty of photographs happen to be 9:16.
    static func looksLikeScreenshot(aspectRatio: Double, url: URL?) -> Bool {
        guard let url,
              let source = CGImageSourceCreateWithURL(url as CFURL, nil),
              let properties = CGImageSourceCopyPropertiesAtIndex(source, 0, nil)
                as? [CFString: Any] else { return false }

        let tiff = properties[kCGImagePropertyTIFFDictionary] as? [CFString: Any]
        let hasCamera = (tiff?[kCGImagePropertyTIFFMake] as? String)?.isEmpty == false
            || (tiff?[kCGImagePropertyTIFFModel] as? String)?.isEmpty == false
        guard !hasCamera else { return false }

        return knownScreenAspectRatios.contains { abs($0 - aspectRatio) < 0.02 }
    }

    static func hasDocumentEdges(_ image: CGImage) async -> Bool {
        do {
            return try await VisionWork.run {
                let request = VNDetectDocumentSegmentationRequest()
                try VNImageRequestHandler(cgImage: image, options: [:]).perform([request])
                return !(request.results ?? []).isEmpty
            }
        } catch {
            // A failed detector must not claim "no document" — that would be a
            // measurement presented as a fact.
            return false
        }
    }

    /// How long ago the photo was taken, from EXIF. Unknown reads as `recent`
    /// rather than `justNow`: claiming immediacy we cannot support would push
    /// create-an-event style actions up on every stripped photo.
    public static func captureDelay(for url: URL, now: Date = Date()) -> ActionContext.CaptureDelay {
        guard let source = CGImageSourceCreateWithURL(url as CFURL, nil),
              let properties = CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any],
              let exif = properties[kCGImagePropertyExifDictionary] as? [CFString: Any],
              let original = exif[kCGImagePropertyExifDateTimeOriginal] as? String else {
            return .recent
        }
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy:MM:dd HH:mm:ss"
        formatter.timeZone = .current
        guard let taken = formatter.date(from: original) else { return .recent }
        return ActionContext.CaptureDelay(seconds: now.timeIntervalSince(taken))
    }
}
