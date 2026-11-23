import SwiftUI

@main
struct ModesApp: App {
    init() { AppDiagnostics.start() }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(AppRuntime.model)
                .tint(.brand)
                .preferredColorScheme(AppRuntime.model.settings.appearance.scheme)
                .onAppear { AppDiagnostics.firstContentAppeared() }
        }
    }
}

private extension Appearance {
    var scheme: ColorScheme? {
        switch self {
        case .system: nil
        case .light: .light
        case .dark: .dark
        }
    }
}
