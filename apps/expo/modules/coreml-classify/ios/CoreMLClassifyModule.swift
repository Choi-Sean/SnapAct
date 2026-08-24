// CoreMLClassifyModule — on-device L1 vision classifier for the Expo app.
//
// Runs the S3 spike's Create ML model (L1Classifier.mlmodel) on an image URI and
// returns the raw class probabilities to JS. The fail-closed BLOCK/ROUTE policy
// lives in JS (src/layer0/visionGate.ts) so it stays visible and testable next to
// the app's other Layer 0 logic — this native side only scores.
//
// iOS only: Core ML is Apple-only. Android would need a separate TFLite path.
import ExpoModulesCore
import CoreML
import Vision
import Foundation

public class CoreMLClassifyModule: Module {
  private var cachedModel: VNCoreMLModel?

  public func definition() -> ModuleDefinition {
    Name("CoreMLClassify")

    // Returns [{ label, confidence }] sorted-agnostic (JS sorts). Rejects on failure;
    // the JS gate treats a rejection as "unavailable" and falls through to OCR.
    AsyncFunction("classify") { (uri: String, promise: Promise) in
      do {
        let model = try self.loadModel()
        let request = VNCoreMLRequest(model: model)
        request.imageCropAndScaleOption = .centerCrop
        let handler = VNImageRequestHandler(url: self.fileURL(from: uri), options: [:])
        try handler.perform([request])
        let observations = (request.results as? [VNClassificationObservation]) ?? []
        let scores = observations.map { obs in
          ["label": obs.identifier, "confidence": Double(obs.confidence)] as [String: Any]
        }
        promise.resolve(scores)
      } catch {
        promise.reject("ERR_COREML_CLASSIFY", error.localizedDescription)
      }
    }

    // Cheap availability probe for JS capability checks.
    Function("isModelAvailable") { () -> Bool in
      return (try? self.loadModel()) != nil
    }
  }

  private func loadModel() throws -> VNCoreMLModel {
    if let cached = cachedModel { return cached }
    guard let modelURL = Self.findModelURL() else {
      throw NSError(domain: "CoreMLClassify", code: 1,
                    userInfo: [NSLocalizedDescriptionKey: "L1Classifier.mlmodel not found in bundle"])
    }
    // Compile the raw .mlmodel at runtime (one-time, then cached) so we don't
    // depend on the build compiling it to .mlmodelc for us.
    let compiledURL = try MLModel.compileModel(at: modelURL)
    let mlModel = try MLModel(contentsOf: compiledURL)
    let vnModel = try VNCoreMLModel(for: mlModel)
    cachedModel = vnModel
    return vnModel
  }

  // The model may land in the module bundle, the app bundle, or a CocoaPods
  // resource bundle depending on how the pod copies it — search all three.
  private static func findModelURL() -> URL? {
    let name = "L1Classifier", ext = "mlmodel"
    let bundles = [Bundle(for: CoreMLClassifyModule.self), Bundle.main]
    for b in bundles {
      if let u = b.url(forResource: name, withExtension: ext) { return u }
      if let bundleURL = b.url(forResource: "CoreMLClassify", withExtension: "bundle"),
         let rb = Bundle(url: bundleURL),
         let u = rb.url(forResource: name, withExtension: ext) { return u }
    }
    return nil
  }

  private func fileURL(from uri: String) -> URL {
    if let u = URL(string: uri), u.scheme != nil { return u }
    return URL(fileURLWithPath: uri.replacingOccurrences(of: "file://", with: ""))
  }
}
