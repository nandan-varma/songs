import SwiftUI

struct MarqueeText: View {
    let text: String

    var isActive = true
    var verticalPadding: CGFloat = 4

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.scenePhase) private var scenePhase
    @State private var textWidth: CGFloat = 0
    @State private var containerWidth: CGFloat = 0
    @State private var offset: CGFloat = 0

    private static let gap: CGFloat = 40
    private static let pause: Duration = .seconds(2.2)

    private static let speed: CGFloat = 30
    private static let fade: CGFloat = 18

    private var overflows: Bool { containerWidth > 0 && textWidth > containerWidth + 0.5 }
    private var scrolls: Bool { overflows && !reduceMotion }

    private struct LoopKey: Equatable {
        let text: String
        let textWidth: CGFloat
        let containerWidth: CGFloat
        let enabled: Bool
    }

    var body: some View {
        Text(text)
            .lineLimit(1)
            .truncationMode(.tail)
            .opacity(scrolls ? 0 : 1)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.vertical, verticalPadding)
            .onGeometryChange(for: CGFloat.self) { $0.size.width } action: { containerWidth = $0 }
            .background(alignment: .leading) {
                Text(text).fixedSize().opacity(0).accessibilityHidden(true)
                    .onGeometryChange(for: CGFloat.self) { $0.size.width } action: { textWidth = $0 }
            }
            .overlay(alignment: .leading) {
                if scrolls {
                    HStack(spacing: Self.gap) {
                        Text(text).fixedSize()
                        Text(text).fixedSize()
                    }
                    .offset(x: offset)
                    .accessibilityHidden(true)
                }
            }
            .mask { if scrolls { edgeMask } else { Rectangle() } }
            .task(id: LoopKey(text: text, textWidth: textWidth, containerWidth: containerWidth,
                              enabled: scrolls && isActive && scenePhase == .active)) { await loop() }
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(text)
    }

    private var edgeMask: some View {
        let f = min(0.2, Self.fade / max(containerWidth, 1))
        return LinearGradient(stops: [
            .init(color: offset < -1 ? .clear : .black, location: 0),
            .init(color: .black, location: f),
            .init(color: .black, location: 1 - f),
            .init(color: .clear, location: 1),
        ], startPoint: .leading, endPoint: .trailing)
    }

    private func loop() async {
        var reset = Transaction()
        reset.disablesAnimations = true
        withTransaction(reset) { offset = 0 }
        guard scrolls, isActive, scenePhase == .active else { return }
        let distance = textWidth + Self.gap
        let seconds = Double(distance / Self.speed)
        while !Task.isCancelled {
            try? await Task.sleep(for: Self.pause)
            if Task.isCancelled { break }
            withAnimation(.linear(duration: seconds)) { offset = -distance }
            try? await Task.sleep(for: .seconds(seconds))
            if Task.isCancelled { break }
            withTransaction(reset) { offset = 0 }
        }
    }
}
