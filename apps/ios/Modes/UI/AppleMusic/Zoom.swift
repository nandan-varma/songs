import SwiftUI

private struct ZoomNamespaceKey: EnvironmentKey {
    static let defaultValue: Namespace.ID? = nil
}

extension EnvironmentValues {
    var zoomNamespace: Namespace.ID? {
        get { self[ZoomNamespaceKey.self] }
        set { self[ZoomNamespaceKey.self] = newValue }
    }
}

private struct ZoomSource<ID: Hashable>: ViewModifier {
    @Environment(\.zoomNamespace) private var namespace
    let id: ID

    func body(content: Content) -> some View {
        if let namespace { content.matchedTransitionSource(id: id, in: namespace) } else { content }
    }
}

private struct ZoomDestination<ID: Hashable>: ViewModifier {
    @Environment(\.zoomNamespace) private var namespace
    let id: ID

    func body(content: Content) -> some View {
        if let namespace { content.navigationTransition(.zoom(sourceID: id, in: namespace)) } else { content }
    }
}

extension View {
    func zoomSource<ID: Hashable>(_ id: ID) -> some View { modifier(ZoomSource(id: id)) }
    func zoomDestination<ID: Hashable>(_ id: ID) -> some View { modifier(ZoomDestination(id: id)) }
}

struct ZoomLink<Label: View>: View {
    let route: MusicRoute
    @ViewBuilder var label: Label

    var body: some View {
        NavigationLink(value: route) { label }.zoomSource(route)
    }
}
