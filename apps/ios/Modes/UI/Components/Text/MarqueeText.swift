import SwiftUI

/// One line of text that scrolls when it is wider than its container, like the title in Apple Music.
///
/// * Fits: a plain `Text`, nothing else.
/// * Too wide: after a short pause the text scrolls slowly, loops with a gap, and fades at the edges.
/// * Reduce Motion: tail truncation, no scrolling.
/// The view never widens its parent: the container is a flexible-width `Text` that truncates, the natural width is measured
/// from an invisible copy in `.background` (which takes no part in layout), and the scrolling copy is an overlay that is masked.
/// Font and colour come from the environment, so style it with `.font(...)` and `.foregroundStyle(...)` from outside.
struct MarqueeText: View {
    let text: String
    /// Scrolling stops (and resets) while this is false, for example when playback is paused.
    var isActive = true

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.scenePhase) private var scenePhase
    @State private var textWidth: CGFloat = 0
    @State private var containerWidth: CGFloat = 0
    @State private var offset: CGFloat = 0

    private static let gap: CGFloat = 40
    private static let pause: Duration = .seconds(2.2)
    /// Points per second: slow enough to read.
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
            .padding(.vertical, 4)                       // room for tall ascenders and descenders; the mask never clips glyphs
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

    /// Soft edges: the trailing edge always, the leading edge only once the text has moved.
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
