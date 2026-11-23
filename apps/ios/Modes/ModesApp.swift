import ModesCore
import SwiftUI

@main
struct ModesApp: App {
    @State private var model: AppModel? = AppRuntime.model
    @State private var failure: String?

    init() { AppDiagnostics.start() }

    var body: some Scene {
        WindowGroup {
            Group {
                if let model {
                    RootView().environment(model)
                } else if let failure {
                    ContentUnavailableView("Couldn’t start", systemImage: "exclamationmark.triangle", description: Text(failure))
                } else {
                    ProgressView()
                }
            }
            .tint(.brand)
            .onAppear { AppDiagnostics.firstContentAppeared() }
            .task {
                guard model == nil else { return }
                let load = AppLog.span("catalog_load_ms")
                do {
                    let m = try await AppRuntime.ensureModel()
                    AppDiagnostics.catalogReady(signature: m.catalog.signature, songs: m.catalog.count, loadMs: load.end())
                    model = m
                }
                catch { AppLog.error("launch", "catalog failed: \(error)"); failure = error.localizedDescription }
            }
        }
    }
}
