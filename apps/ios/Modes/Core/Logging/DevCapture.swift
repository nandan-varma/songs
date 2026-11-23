import CoreGraphics
import Foundation
import ModesCore
import UIKit

@MainActor
enum DevCapture {
    static let isEnabled = ProcessInfo.processInfo.environment["MODES_CAPTURE"] == "1"
    static let maxShots = 80
    static let interval: TimeInterval = 1.5

    private static var timer: Timer?
    private static var last: FrameSignature?
    private static var lastScreen: String?
    private static let ioQueue = DispatchQueue(label: "com.nandanvarma.modes.capture", qos: .utility)
    private static let directory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        .appendingPathComponent("shots", isDirectory: true)

    static func startIfEnabled() {
        guard isEnabled, timer == nil else { return }
        try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        AppLog.info("capture", "enabled", ["interval_s": interval, "max_shots": maxShots])
        timer = Timer.scheduledTimer(withTimeInterval: interval, repeats: true) { _ in
            MainActor.assumeIsolated { tick() }
        }
    }

    static func snap(_ name: String) {
        guard isEnabled, UIApplication.shared.applicationState == .active, let image = render() else { return }
        save(image, name: name)
    }

    private static func tick() {
        guard UIApplication.shared.applicationState == .active, let image = render() else { return }
        let hint = ScreenHint.current().text
        if hint != lastScreen { lastScreen = hint; AppLog.info("screen", hint.isEmpty ? "unknown" : hint) }
        guard let sig = signature(of: image), FrameSignature.isNew(sig, since: last) else { return }
        last = sig
        save(image, name: nil)
    }

    private static func render() -> UIImage? {
        let windows = ScreenHint.foregroundWindows()
        guard let base = windows.first(where: \.isKeyWindow) ?? windows.first, let screen = base.windowScene?.screen else { return nil }
        let bounds = screen.bounds
        let format = UIGraphicsImageRendererFormat.preferred()
        format.scale = screen.scale / 2
        format.opaque = true
        return UIGraphicsImageRenderer(bounds: bounds, format: format).image { _ in
            for w in windows {
                w.drawHierarchy(in: w.frame, afterScreenUpdates: false)
            }
        }
    }

    private static func signature(of image: UIImage) -> FrameSignature? {
        guard let cg = image.cgImage else { return nil }
        let side = FrameSignature.side
        var px = [UInt8](repeating: 0, count: side * side)
        let ok = px.withUnsafeMutableBytes { raw -> Bool in
            guard let ctx = CGContext(data: raw.baseAddress, width: side, height: side, bitsPerComponent: 8, bytesPerRow: side,
                                      space: CGColorSpaceCreateDeviceGray(), bitmapInfo: CGImageAlphaInfo.none.rawValue) else { return false }
            ctx.interpolationQuality = .low
            ctx.draw(cg, in: CGRect(x: 0, y: 0, width: side, height: side))
            return true
        }
        return ok ? FrameSignature(pixels: px) : nil
    }

    private static func save(_ image: UIImage, name: String?) {
        let now = Date()
        var file = LogFormat.fileStamp(now)
        if let name { file += "-" + name.filter { $0.isLetter || $0.isNumber || $0 == "-" || $0 == "_" }.prefix(40) }
        file += ".jpg"
        let url = directory.appendingPathComponent(file)
        let dir = directory
        let keep = maxShots
        let screen = ScreenHint.current().text
        AppLog.info("capture", "shot", ["file": file, "screen": screen])
        ioQueue.async {
            guard let data = image.jpegData(compressionQuality: 0.7) else { return }
            try? data.write(to: url, options: .atomic)
            let names = ((try? FileManager.default.contentsOfDirectory(atPath: dir.path)) ?? []).filter { $0.hasSuffix(".jpg") }
            for old in LogRetention.excess(names, keep: keep) { try? FileManager.default.removeItem(at: dir.appendingPathComponent(old)) }
        }
    }
}
