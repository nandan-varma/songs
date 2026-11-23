import ModesCore
import LNPopupUI
import SwiftUI

enum AppTab: Hashable { case home, library, search }

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

    var body: some View {
        TabView(selection: $tab) {
            Tab("Listen now", systemImage: "play.circle.fill", value: AppTab.home) { HomeView() }
            Tab("Library", systemImage: "heart.text.square", value: AppTab.library) { LibraryView() }
            Tab(value: AppTab.search, role: .search) { SearchView() }
        }
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
