import Foundation

@MainActor
enum AppRuntime {
    static let model: AppModel = {
        AppLog.info("launch", "starting, build \(Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "?")")
        return AppModel()
    }()
}
