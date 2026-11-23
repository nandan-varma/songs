import SwiftUI

@main
struct ModesApp: App {
    init() { AppDiagnostics.start() }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(AppRuntime.model)
                .tint(.brand)
                .onAppear { AppDiagnostics.firstContentAppeared() }
        }
    }
}
