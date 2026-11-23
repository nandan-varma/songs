import Foundation
import Observation
import ModesCore

/// Owns the one `AppModel` for the process.
///
/// An `AudioPlaybackIntent` (Siri, Shortcuts, Action Button) can launch the app process with no UI scene, so the model
/// cannot depend on a view's `.task`. Both the UI and the intents go through `ensureModel()`, which coalesces concurrent
/// callers onto a single load so there is never a second model or a second `AVPlayer`.
@MainActor
enum AppRuntime {
    private(set) static var model: AppModel?
    private static var loading: Task<AppModel, any Error>?

    static func ensureModel() async throws -> AppModel {
        if let model { return model }
        if let loading { return try await loading.value }
        let task = Task { () -> AppModel in
            AppLog.installCrashHooks()
            AppLog.info("launch", "starting, build \(Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "?")")
            let catalog = try await Task.detached(priority: .userInitiated) { try Catalog() }.value
            let created = AppModel(catalog: catalog)
            model = created
            return created
        }
        loading = task
        defer { loading = nil }   // a failed load can be retried by the next caller
        return try await task.value
    }
}
