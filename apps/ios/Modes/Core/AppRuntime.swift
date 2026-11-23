import Foundation

/// Owns the one `AppModel` for the process.
///
/// An `AudioPlaybackIntent` (Siri, Shortcuts, Action Button) can launch the app process with no UI scene, so the model
/// cannot depend on a view. Both the UI and the intents read `model`, which is created on first use, so there is never a
/// second model or a second `AVPlayer`.
@MainActor
enum AppRuntime {
    static let model: AppModel = {
        AppLog.info("launch", "starting, build \(Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "?")")
        return AppModel()
    }()
}
