import CoreGraphics
import CoreVideo
import Foundation
import ImageIO

/// Turns a photo into the exact input the image encoder expects.
///
/// Two separate jobs that are easy to conflate:
///
/// 1. Get the pixels into memory without decoding at full resolution.
///    A Share Extension that decodes a 48MP photo hits the memory cap and is
///    killed with no error to catch (ios-platform.md). `downsample(url:)` uses
///    CGImageSourceCreateThumbnailAtIndex, which decodes straight to the size
///    asked for.
///
/// 2. Produce a 256×256 buffer. This is a SQUASH, not an aspect-preserving
///    fit, because the Python reference that generated class_embeddings.json
///    does `Image.resize((256, 256))` — and a model compared against vectors
///    built one way must be fed images prepared the same way. Letterboxing
///    here would be defensible in isolation and wrong in context.
public enum PixelBuffer {
    /// The encoder's input size. Not a tunable: it is baked into the
    /// .mlpackage's imageType.
    public static let side = 256

    /// Decodes at most `maxPixels` on the long edge, straight from the file.
    /// Use this instead of loading a UIImage/NSImage and scaling afterwards.
    public static func downsample(url: URL, maxPixels: Int = 1024) throws -> CGImage {
        guard let source = CGImageSourceCreateWithURL(url as CFURL, nil) else {
            throw PixelBufferError.unreadableImage(url)
        }
        let options: [CFString: Any] = [
            kCGImageSourceCreateThumbnailFromImageAlways: true,
            kCGImageSourceCreateThumbnailWithTransform: true,   // honour EXIF orientation
            kCGImageSourceShouldCacheImmediately: true,
            kCGImageSourceThumbnailMaxPixelSize: maxPixels,
        ]
        guard let image = CGImageSourceCreateThumbnailAtIndex(source, 0, options as CFDictionary) else {
            throw PixelBufferError.unreadableImage(url)
        }
        return image
    }

    /// Draws `image` into a 256×256 BGRA buffer, stretching to fill.
    ///
    /// No pixel-value scaling or mean subtraction happens here. The model's
    /// input is an imageType, so Core ML applies that inside the graph — the
    /// first op after `image` is a multiply by 1/255. Doing it again raises no
    /// error and quietly degrades accuracy.
    public static func make(from image: CGImage) throws -> CVPixelBuffer {
        var buffer: CVPixelBuffer?
        let attributes: [CFString: Any] = [
            kCVPixelBufferCGImageCompatibilityKey: true,
            kCVPixelBufferCGBitmapContextCompatibilityKey: true,
        ]
        let status = CVPixelBufferCreate(kCFAllocatorDefault, side, side,
                                         kCVPixelFormatType_32BGRA,
                                         attributes as CFDictionary, &buffer)
        guard status == kCVReturnSuccess, let buffer else {
            throw PixelBufferError.allocationFailed(status)
        }

        CVPixelBufferLockBaseAddress(buffer, [])
        defer { CVPixelBufferUnlockBaseAddress(buffer, []) }

        guard let context = CGContext(
            data: CVPixelBufferGetBaseAddress(buffer),
            width: side, height: side,
            bitsPerComponent: 8,
            bytesPerRow: CVPixelBufferGetBytesPerRow(buffer),
            space: CGColorSpaceCreateDeviceRGB(),
            bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue
                | CGBitmapInfo.byteOrder32Little.rawValue
        ) else {
            throw PixelBufferError.contextCreationFailed
        }

        context.interpolationQuality = .high
        context.draw(image, in: CGRect(x: 0, y: 0, width: side, height: side))
        return buffer
    }
}

public enum PixelBufferError: Error, CustomStringConvertible {
    case unreadableImage(URL)
    case allocationFailed(CVReturn)
    case contextCreationFailed

    public var description: String {
        switch self {
        case .unreadableImage(let url):
            return "이미지를 읽지 못했습니다: \(url.lastPathComponent)"
        case .allocationFailed(let status):
            return "CVPixelBuffer 생성 실패 (status \(status))"
        case .contextCreationFailed:
            return "CGContext 생성 실패"
        }
    }
}
