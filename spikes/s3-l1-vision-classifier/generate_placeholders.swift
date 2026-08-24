// Placeholder image generator for the L1 classifier spike.
//
// These are NOT real photos. They are geometric stand-ins with the right *layout*
// characteristics per class, so the whole train -> evaluate -> export pipeline runs
// end-to-end today and the confusion pairs (id_card vs business_card, etc.) are
// deliberately made similar. Replace data/train and data/test with real photos to
// get a real S3 number. See CLASSES.md.
//
// Usage:  swift generate_placeholders.swift <outDir> <perClassCount>
// Writes: <outDir>/<class>/<class>_<i>.png   (300x300 RGBA PNG)

import Foundation
import CoreGraphics
import ImageIO

let side = 300
let args = CommandLine.arguments
let outDir = args.count > 1 ? args[1] : "data/train"
let perClass = args.count > 2 ? Int(args[2]) ?? 24 : 24

let classes = [
    "business_card", "id_card", "payment_card", "passport", "prescription",
    "financial_doc", "receipt", "event_flyer", "document", "medication",
]

func ctxNew() -> CGContext {
    let cs = CGColorSpaceCreateDeviceRGB()
    return CGContext(data: nil, width: side, height: side, bitsPerComponent: 8,
                     bytesPerRow: 0, space: cs,
                     bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
}
func r(_ a: Double, _ b: Double) -> Double { Double.random(in: a...b) }
func fill(_ c: CGContext, _ red: Double, _ g: Double, _ b: Double, _ a: Double = 1) {
    c.setFillColor(red: red, green: g, blue: b, alpha: a)
}
func box(_ c: CGContext, _ x: Double, _ y: Double, _ w: Double, _ h: Double) {
    c.fill(CGRect(x: x, y: y, width: w, height: h))
}
func oval(_ c: CGContext, _ x: Double, _ y: Double, _ w: Double, _ h: Double) {
    c.fillEllipse(in: CGRect(x: x, y: y, width: w, height: h))
}
// A row of "text" bars starting at (x,y) going down.
func textLines(_ c: CGContext, x: Double, y: Double, w: Double, rows: Int, gap: Double = 14,
              shade: Double = 0.2) {
    fill(c, shade, shade, shade)
    for i in 0..<rows {
        let ww = w * r(0.55, 1.0)
        box(c, x, y - Double(i) * gap, ww, 5)
    }
}
func bg(_ c: CGContext, _ v: Double) { fill(c, v, v, v); box(c, 0, 0, Double(side), Double(side)) }
// Draw a horizontal card with slight rotation + jitter, run body() in card-local coords.
func card(_ c: CGContext, tint: (Double, Double, Double), body: (CGContext, CGRect) -> Void) {
    bg(c, r(0.82, 0.93))
    c.saveGState()
    c.translateBy(x: Double(side) / 2, y: Double(side) / 2)
    c.rotate(by: r(-0.06, 0.06))
    let w = r(230, 260), h = r(150, 175)
    let rect = CGRect(x: -w / 2, y: -h / 2, width: w, height: h)
    fill(c, tint.0, tint.1, tint.2)
    c.fill(rect)
    body(c, rect)
    c.restoreGState()
}

func draw(_ cls: String, _ c: CGContext) {
    switch cls {
    case "business_card":
        card(c, tint: (r(0.94, 0.99), r(0.94, 0.99), r(0.94, 0.99))) { c, rc in
            let hue = (r(0.1, 0.9), r(0.2, 0.8), r(0.3, 0.9))
            fill(c, hue.0, hue.1, hue.2); box(c, rc.minX, rc.minY, 12, rc.height) // accent stripe
            textLines(c, x: rc.minX + 30, y: rc.maxY - 30, w: rc.width * 0.6, rows: 4)
        }
    case "id_card":
        // Card + a face photo box on the left + colored header -> close to business_card.
        card(c, tint: (r(0.86, 0.94), r(0.9, 0.96), r(0.94, 0.99))) { c, rc in
            fill(c, r(0.2, 0.5), r(0.3, 0.6), r(0.6, 0.85)) // header band
            box(c, rc.minX, rc.maxY - 22, rc.width, 22)
            fill(c, 0.85, 0.72, 0.6); box(c, rc.minX + 14, rc.minY + 18, 52, 66) // face photo
            textLines(c, x: rc.minX + 80, y: rc.maxY - 40, w: rc.width * 0.4, rows: 5, gap: 12)
        }
    case "payment_card":
        card(c, tint: (r(0.1, 0.35), r(0.15, 0.45), r(0.35, 0.7))) { c, rc in
            fill(c, 0.85, 0.7, 0.2); box(c, rc.minX + 22, rc.maxY - 55, 40, 30) // gold chip
            fill(c, 0.95, 0.95, 0.95) // number groups
            for g in 0..<4 { box(c, rc.minX + 20 + Double(g) * 55, rc.midY - 8, 40, 9) }
            box(c, rc.minX + 20, rc.minY + 22, 110, 7) // name
        }
    case "passport":
        bg(c, r(0.1, 0.2))
        fill(c, r(0.25, 0.45), r(0.05, 0.12), r(0.08, 0.16)) // maroon-ish full bleed
        box(c, 20, 20, Double(side) - 40, Double(side) - 40)
        fill(c, 0.8, 0.66, 0.25); oval(c, Double(side) / 2 - 30, Double(side) / 2 - 30, 60, 60) // emblem
        fill(c, 0.8, 0.66, 0.25); box(c, 60, Double(side) - 70, Double(side) - 120, 10) // title
    case "prescription":
        bg(c, 0.97)
        fill(c, r(0.2, 0.5), r(0.4, 0.6), r(0.5, 0.75)); box(c, 24, Double(side) - 60, Double(side) - 48, 36) // header
        fill(c, 0.7, 0.1, 0.1); box(c, 30, Double(side) - 120, 24, 6); box(c, 39, Double(side) - 132, 6, 24) // Rx cross
        for i in 0..<6 { // label: value rows
            let y = Double(side) - 150 - Double(i) * 22
            fill(c, 0.3, 0.3, 0.3); box(c, 70, y, 40, 6)
            fill(c, 0.5, 0.5, 0.5); box(c, 130, y, 120, 6)
        }
    case "financial_doc":
        bg(c, 0.98)
        fill(c, 0.2, 0.25, 0.35); box(c, 20, Double(side) - 50, Double(side) - 40, 26) // header row
        for col in 0..<4 { fill(c, 0.6, 0.6, 0.6); box(c, 40 + Double(col) * 62, 30, 1.5, Double(side) - 110) } // columns
        for row in 0..<8 { // right-aligned number bars
            let y = Double(side) - 80 - Double(row) * 22
            for col in 1..<4 { fill(c, 0.25, 0.25, 0.25); box(c, 30 + Double(col) * 62, y, 44, 6) }
        }
    case "receipt":
        bg(c, r(0.8, 0.9))
        let w = r(120, 150), x = (Double(side) - w) / 2
        fill(c, 0.99, 0.99, 0.98); box(c, x, 15, w, Double(side) - 30) // tall narrow paper
        fill(c, 0.25, 0.25, 0.25)
        for i in 0..<16 { box(c, x + 12, Double(side) - 45 - Double(i) * 14, w * r(0.6, 0.9), 4) } // dense rows
    case "event_flyer":
        let hue = (r(0.3, 0.95), r(0.2, 0.8), r(0.2, 0.9))
        fill(c, hue.0, hue.1, hue.2); box(c, 0, 0, Double(side), Double(side)) // vibrant full bleed
        fill(c, 1, 1, 1); box(c, 30, Double(side) - 90, Double(side) - 60, 34) // big title
        fill(c, 1, 1, 1, 0.85); oval(c, Double(side) / 2 - 35, 60, 70, 70) // image circle
        fill(c, 1, 1, 1); box(c, 40, 40, 120, 8) // date/detail
    case "document":
        bg(c, r(0.9, 0.95))
        fill(c, 0.99, 0.99, 0.99); box(c, 30, 20, Double(side) - 60, Double(side) - 40) // page
        fill(c, 0.3, 0.3, 0.3)
        for i in 0..<14 { box(c, 48, Double(side) - 50 - Double(i) * 16, (Double(side) - 96) * r(0.8, 1.0), 5) } // paragraph
    case "medication":
        bg(c, r(0.9, 0.96))
        fill(c, 0.95, 0.95, 0.97); box(c, 105, 60, 90, 170) // bottle
        fill(c, r(0.1, 0.4), r(0.5, 0.8), r(0.3, 0.6)); box(c, 108, 95, 84, 70) // colored label
        textLines(c, x: 116, y: 150, w: 66, rows: 4, gap: 12, shade: 0.95)
        fill(c, 0.7, 0.7, 0.72); box(c, 118, 230, 64, 18) // cap
        fill(c, 0.9, 0.4, 0.4); oval(c, 40, 40, 26, 16); oval(c, 60, 55, 26, 16) // pills
    default: bg(c, 0.5)
    }
}

func savePNG(_ c: CGContext, _ path: String) {
    guard let img = c.makeImage() else { return }
    let url = URL(fileURLWithPath: path) as CFURL
    guard let dest = CGImageDestinationCreateWithURL(url, "public.png" as CFString, 1, nil) else { return }
    CGImageDestinationAddImage(dest, img, nil)
    CGImageDestinationFinalize(dest)
}

let fm = FileManager.default
for cls in classes {
    let dir = "\(outDir)/\(cls)"
    try? fm.createDirectory(atPath: dir, withIntermediateDirectories: true)
    for i in 0..<perClass {
        let c = ctxNew()
        draw(cls, c)
        savePNG(c, "\(dir)/\(cls)_\(i).png")
    }
}
print("Wrote \(classes.count) classes x \(perClass) images to \(outDir)")
