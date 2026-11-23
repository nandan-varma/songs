import ModesCore
import LNPopupUI
import SwiftUI

enum AppTab: Hashable { case home, new, radio, library, search }

struct RootView: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        if model.onboarded { MainTabs() } else { OnboardingView() }
    }
}

struct MainTabs: View {
    @Environment(AppModel.self) private var model
    @State private var tab: AppTab = .home
    @State private var open = false

    @State private var barShown = false
    @State private var metrics = Metrics()

    var body: some View {
        TabView(selection: $tab) {
            Tab("Home", systemImage: "house.fill", value: AppTab.home) { HomeView() }
            Tab("New", systemImage: "square.grid.2x2.fill", value: AppTab.new) { NewView() }
            Tab("Radio", systemImage: "dot.radiowaves.left.and.right", value: AppTab.radio) { RadioView() }
            Tab("Library", systemImage: "music.note.square.stack.fill", value: AppTab.library) { LibraryView() }
            Tab(value: AppTab.search, role: .search) { SearchView() }
        }
        .trackMetrics($metrics)
        .tabBarMinimizeBehavior(.onScrollDown)
        .popup(isBarPresented: Binding(get: { barShown }, set: { _ in }), isPopupOpen: $open) {
            PlayerView()
        }
        .popupInteractionStyle(.automatic)
        .popupCloseButtonStyle(.grabber)
        .popupBarProgressViewStyle(.none)
        .popupBarMarqueeScrollEnabled()
        .onChange(of: model.hasSession, initial: true) { _, active in barShown = active && model.current != nil }
        .onChange(of: model.current?.id) { if model.hasSession, model.current != nil { barShown = true } }
        .overlay(alignment: .bottom) { ToastView(text: open ? nil : model.toast, allowsUndo: !open).padding(.bottom, 150) }
    }
}
