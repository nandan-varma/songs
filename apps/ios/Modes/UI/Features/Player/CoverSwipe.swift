import Observation
import SwiftUI
import UIKit

/// Signed swipe progress, -1 (dislike, committed) ... +1 (like, committed). A tiny observable so only the views that read
/// it (the backdrop and the dimmed rows) re-render while the finger moves, not the whole player.
@Observable
final class SwipeReveal {
    var progress: CGFloat = 0
}

enum SwipeAction { case like, dislike }

/// A horizontal-only pan on the cover, backed by a `UIPanGestureRecognizer` that refuses to begin for vertical drags, so
/// those fall through to LNPopupUI's own interactive close (cover morphing into the mini bar, velocity-based completion).
/// - The recognizer begins only when the initial velocity is predominantly horizontal (|vx| > 1.2 |vy|).
/// - The cover follows the finger and tilts like a card; the backdrop reveals LIKE (right) or DISLIKE (left).
///   The commit threshold is 110 pt. One haptic tick fires when the threshold is crossed (and again when dragging back).
struct CoverSwipe: ViewModifier {
    static let threshold: CGFloat = 110
    private static let flyDistance: CGFloat = 560

    let reveal: SwipeReveal
    let itemID: String
    let onBegin: () -> Void
    let onWillDislike: () -> Void
    let onCommit: (SwipeAction) -> Void

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var dx: CGFloat = 0
    @State private var wasCrossed = false
    @State private var crossTick = 0
    @State private var burst: UUID?
    @State private var awaitingNext = false

    func body(content: Content) -> some View {
        let tilt = reduceMotion ? 0 : Double(max(-14, min(14, dx / 12)))
        return content
            .overlay { if let burst { HeartBurst(reduceMotion: reduceMotion).id(burst) } }
            .rotationEffect(.degrees(tilt), anchor: .bottom)
            .offset(x: reduceMotion ? 0 : dx)
            .gesture(HorizontalPan(onBegan: began, onChanged: changed, onEnded: ended))
            .sensoryFeedback(.impact(weight: .medium), trigger: crossTick)
            .onChange(of: itemID) { settle() }
    }

    private func began() { if !awaitingNext { onBegin() } }

    private func changed(_ width: CGFloat) {
        guard !awaitingNext else { return }
        dx = width
        reveal.progress = max(-1, min(1, width / Self.threshold))
        let crossed = abs(width) >= Self.threshold
        if crossed != wasCrossed { wasCrossed = crossed; crossTick += 1 }
    }

    /// `width` is the final translation, or 0 when the gesture was cancelled.
    private func ended(_ width: CGFloat) {
        guard !awaitingNext else { return }
        wasCrossed = false
        endHorizontal(width)
    }

    private func endHorizontal(_ width: CGFloat) {
        guard abs(width) >= Self.threshold else {
            withAnimation(.spring(duration: 0.4, bounce: 0.3)) { dx = 0; reveal.progress = 0 }
            return
        }
        if width > 0 {
            withAnimation(.spring(duration: 0.4, bounce: 0.3)) { dx = 0; reveal.progress = 0 }
            burst = UUID()
            onCommit(.like)
            Task { try? await Task.sleep(for: .milliseconds(900)); burst = nil }
        } else if reduceMotion {
            withAnimation(.easeOut(duration: 0.25)) { dx = 0; reveal.progress = 0 }
            onWillDislike()
            onCommit(.dislike)
        } else {
            awaitingNext = true
            onWillDislike()
            withAnimation(.easeIn(duration: 0.28)) { dx = Self.flyDistance }
            Task {
                try? await Task.sleep(for: .milliseconds(300))
                onCommit(.dislike)
                withAnimation(.easeOut(duration: 0.4)) { reveal.progress = 0 }
                try? await Task.sleep(for: .milliseconds(1500))   // the next cover normally arrives well before this
                settle()
            }
        }
    }

    /// The next cover is in: bring it in from the opposite (leading) edge, tilted, and spring it into place.
    private func settle() {
        guard awaitingNext else { return }
        awaitingNext = false
        var t = Transaction(); t.disablesAnimations = true
        withTransaction(t) { dx = -Self.flyDistance }
        Task {
            try? await Task.sleep(for: .milliseconds(40))
            withAnimation(.spring(duration: 0.5, bounce: 0.18)) { dx = 0 }
        }
    }
}

extension View {
    func coverSwipe(reveal: SwipeReveal, itemID: String, onBegin: @escaping () -> Void, onWillDislike: @escaping () -> Void,
                    onCommit: @escaping (SwipeAction) -> Void) -> some View {
        modifier(CoverSwipe(reveal: reveal, itemID: itemID, onBegin: onBegin, onWillDislike: onWillDislike, onCommit: onCommit))
    }

    /// Dims a row slightly while a swipe reveal is active so the backdrop reads clearly.
    func dimmedByReveal(_ reveal: SwipeReveal) -> some View { modifier(RevealDim(reveal: reveal)) }
}

private struct RevealDim: ViewModifier {
    let reveal: SwipeReveal
    func body(content: Content) -> some View { content.opacity(1 - 0.4 * min(1, abs(reveal.progress))) }
}

/// The player backdrop's reveal: an action-coloured gradient that grows in from the edge the finger moves toward, with a
/// large glyph and label. Hue, icon and label all differ, so it never relies on red versus green.
struct SwipeBackdrop: View {
    let reveal: SwipeReveal

    var body: some View {
        let p = reveal.progress
        let amount = min(1, abs(p))
        let like = p > 0
        let committed = amount >= 1
        let color: Color = like ? .brand : Color(hue: 0.64, saturation: 0.6, brightness: 0.55)
        GeometryReader { g in
            if amount > 0.001 {
                ZStack(alignment: like ? .topLeading : .topTrailing) {
                    LinearGradient(colors: [color, color.opacity(0)], startPoint: like ? .leading : .trailing, endPoint: like ? .trailing : .leading)
                        .frame(width: g.size.width * (0.3 + 0.7 * amount))
                        .opacity(min(1, amount * 1.3))
                        .frame(maxWidth: .infinity, alignment: like ? .leading : .trailing)
                    VStack(spacing: 8) {
                        Image(systemName: like ? (committed ? "heart.fill" : "heart") : (committed ? "hand.thumbsdown.fill" : "hand.thumbsdown"))
                            .font(.system(size: 60, weight: .semibold))
                            .contentTransition(.symbolEffect(.replace))
                            .scaleEffect(committed ? 1.15 : 0.5 + 0.5 * amount)
                            .animation(.spring(duration: 0.35, bounce: 0.5), value: committed)
                        Text(like ? "Love it" : "Suggest less")
                            .font(.subheadline.weight(.bold)).multilineTextAlignment(.center).captionBlock(lines: 3)
                    }
                    .foregroundStyle(.white)
                    .frame(width: 92)
                    .padding(.horizontal, 10)
                    .padding(.top, g.size.height * 0.3 - 40)
                    .opacity(amount)
                    .offset(x: (1 - amount) * (like ? -30 : 30))
                }
                .frame(width: g.size.width, height: g.size.height, alignment: .top)
            }
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }
}

/// A heart that pops and scatters smaller hearts over the cover. Reduce Motion gets a single fading heart.
private struct HeartBurst: View {
    let reduceMotion: Bool
    @State private var go = false

    var body: some View {
        ZStack {
            Image(systemName: "heart.fill").font(.system(size: 84))
                .scaleEffect(reduceMotion ? 1 : (go ? 1.2 : 0.4)).opacity(go ? 0 : 1)
            if !reduceMotion {
                ForEach(0..<8, id: \.self) { i in
                    let a = Double(i) / 8 * 2 * .pi
                    let r: CGFloat = go ? 130 : 24
                    Image(systemName: "heart.fill").font(.system(size: i.isMultiple(of: 2) ? 22 : 14))
                        .offset(x: cos(a) * r, y: sin(a) * r)
                        .scaleEffect(go ? 0.4 : 1).opacity(go ? 0 : 1)
                }
            }
        }
        .foregroundStyle(Color.brand)
        .allowsHitTesting(false)
        .accessibilityHidden(true)
        .onAppear { withAnimation(.easeOut(duration: 0.75)) { go = true } }
    }
}

/// Wraps a pan recognizer that only begins for horizontal drags. It is not required to wait for, or to fail before, any
/// other recognizer, and it does not cancel touches, so LNPopupUI's pan and the double-tap are never delayed.
private struct HorizontalPan: UIGestureRecognizerRepresentable {
    let onBegan: () -> Void
    let onChanged: (CGFloat) -> Void
    let onEnded: (CGFloat) -> Void

    final class Coordinator: NSObject, UIGestureRecognizerDelegate {
        func gestureRecognizerShouldBegin(_ gestureRecognizer: UIGestureRecognizer) -> Bool {
            guard let pan = gestureRecognizer as? UIPanGestureRecognizer else { return false }
            let v = pan.velocity(in: pan.view)
            return abs(v.x) > 1.2 * abs(v.y)
        }
    }

    func makeCoordinator(converter: CoordinateSpaceConverter) -> Coordinator { Coordinator() }

    func makeUIGestureRecognizer(context: Context) -> UIPanGestureRecognizer {
        let pan = UIPanGestureRecognizer()
        pan.maximumNumberOfTouches = 1
        pan.cancelsTouchesInView = false
        pan.delaysTouchesBegan = false
        pan.delegate = context.coordinator
        return pan
    }

    func handleUIGestureRecognizerAction(_ recognizer: UIPanGestureRecognizer, context: Context) {
        let x = recognizer.translation(in: recognizer.view).x
        switch recognizer.state {
        case .began: onBegan(); onChanged(x)
        case .changed: onChanged(x)
        case .ended: onEnded(x)
        case .cancelled, .failed: onEnded(0)
        default: break
        }
    }
}
