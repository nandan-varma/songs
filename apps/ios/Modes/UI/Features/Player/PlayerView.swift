import LNPopupUI
import ModesCore
import SwiftUI

struct PlayerView: View {
    @Environment(AppModel.self) private var model
    @State private var pane = PlayerPane.artwork
    @Namespace private var morph
    @State private var queueWarm = false
    @State private var favoriteTick = 0
    @State private var feedbackTick = 0
    @State private var reveal = SwipeReveal()
    @State private var hintDismissed = false
    @State private var quietSwap = false
    @AppStorage("hint.swipedLike") private var likedBySwipe = false
    @AppStorage("hint.swipedDislike") private var dislikedBySwipe = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.dynamicTypeSize) private var typeSize
    @ScaledMetric(relativeTo: .title) private var sideIcon = 34
    @ScaledMetric(relativeTo: .title) private var playIcon = 60
    @ScaledMetric(relativeTo: .body) private var rowIcon = 22

    var body: some View {
        GeometryReader { geo in
            Group {
                if typeSize.isAccessibilitySize {
                    ScrollView { column(side: geo.size.width * PlayerLayout.artWidth, gap: 18, top: 8) }
                        .scrollBounceBehavior(.basedOnSize)
                } else {
                    proportional(geo)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
            .background { PlayerBackground(reveal: reveal) }
            .overlay(alignment: .bottom) { ToastView(text: model.toast).padding(.bottom, 24) }
        }
        .environment(\.colorScheme, .dark)
        .tint(.white)
        .foregroundStyle(.white)
        .haptic(.success, trigger: favoriteTick)
        .haptic(.impact(weight: .medium), trigger: feedbackTick)
        .modifier(PlayerPopupBar())
    }

    static let placeholder: UIImage = {
        let size = CGSize(width: 120, height: 120)
        return UIGraphicsImageRenderer(size: size).image { ctx in
            UIColor.secondarySystemFill.setFill(); ctx.fill(CGRect(origin: .zero, size: size))
            let cfg = UIImage.SymbolConfiguration(pointSize: 48, weight: .regular)
            UIImage(systemName: "music.note", withConfiguration: cfg)?.withTintColor(.tertiaryLabel, renderingMode: .alwaysOriginal)
                .draw(at: CGPoint(x: 36, y: 34))
        }
    }()

    private func proportional(_ geo: GeometryProxy) -> some View {
        let item = model.current
        let inset = geo.safeAreaInsets
        let screen = geo.size.height + inset.top + inset.bottom
        let w = geo.size.width
        let artHeight = (PlayerLayout.artBottom - PlayerLayout.artTop) * screen
        let side = min(w * PlayerLayout.artWidth, artHeight)
        let content = w * (1 - 2 * PlayerLayout.margin)
        let titleWidth = w * (PlayerLayout.ellipsisCenter - PlayerLayout.margin) + PlayerLayout.buttonSize / 2
        func place<Content: View>(_ center: Double, x: Double = 0.5, width: CGFloat, @ViewBuilder _ view: () -> Content) -> some View {
            view().frame(width: width).position(x: w * x, y: center * screen - inset.top)
        }
        return ZStack(alignment: .topLeading) {
            SleepTimerBadge().frame(maxWidth: .infinity)
            if pane == .artwork {
                place((PlayerLayout.artTop + PlayerLayout.artBottom) / 2, width: w) { artworkStage(item, side: side) }
                place(PlayerLayout.titleCenter, x: PlayerLayout.margin + titleWidth / 2 / w, width: titleWidth) { titleRow(item) }
                    .transition(.opacity.animation(.easeOut(duration: 0.14)))
            } else {
                place(0.149, width: content) { compactHeader(item) }
                    .transition(.opacity.animation(.easeOut(duration: 0.2).delay(0.08)))
            }
            queueLayer.frame(width: content, height: (0.645 - 0.215) * screen)
                .position(x: w / 2, y: (0.215 + 0.645) / 2 * screen - inset.top)
            if pane == .lyrics {
                LyricsPane().frame(width: content, height: (0.645 - 0.215) * screen)
                    .position(x: w / 2, y: (0.215 + 0.645) / 2 * screen - inset.top)
                    .transition(.opacity.animation(.easeOut(duration: 0.22).delay(0.1)))
            }
            place(PlayerLayout.progressCenter, width: content) { PlayerScrubber() }
            place(PlayerLayout.transportCenter, width: w) { transport(width: w) }
            place(PlayerLayout.volumeCenter, width: w) { volume(width: w) }
            place(PlayerLayout.bottomCenter, width: w) { bottomRow(width: w) }
        }
        .frame(width: w, height: geo.size.height, alignment: .topLeading)
        .animation(reduceMotion ? nil : .smooth(duration: 0.36), value: pane)
        .task { try? await Task.sleep(for: .milliseconds(700)); queueWarm = true }
    }

    @ViewBuilder private var queueLayer: some View {
        if queueWarm || pane == .queue {
            QueuePane()
                .opacity(pane == .queue ? 1 : 0)
                .animation(reduceMotion ? nil : .easeOut(duration: 0.24).delay(pane == .queue ? 0.1 : 0), value: pane)
                .allowsHitTesting(pane == .queue)
                .accessibilityHidden(pane != .queue)
        }
    }

    @ViewBuilder private var paneContent: some View {
        switch pane {
        case .lyrics: LyricsPane()
        case .queue: QueuePane()
        case .artwork: EmptyView()
        }
    }

    private func compactHeader(_ item: QueueItem?) -> some View {
        let fav = model.isFavorite(item)
        return CompactHeader(item: item, morph: morph) {
            Button { favorite() } label: {
                Image(systemName: fav ? "star.fill" : "star").font(.title3).frame(width: PlayerLayout.buttonSize, height: PlayerLayout.buttonSize)
            }
            .buttonStyle(PressableStyle()).accessibilityLabel("Favorite")
            Menu { PlayerMenuItems(item: item) { feedbackTick += 1 } } label: {
                Image(systemName: "ellipsis").font(.title3).frame(width: PlayerLayout.buttonSize, height: PlayerLayout.buttonSize)
            }
            .accessibilityLabel("More")
        }
    }

    private func column(side: CGFloat, gap: CGFloat, top: CGFloat) -> some View {
        let item = model.current
        return VStack(spacing: 0) {
            SleepTimerBadge()
            if pane == .artwork {
                artworkStage(item, side: side).padding(.top, top)
                titleRow(item).padding(.top, gap * 1.5)
            } else {
                compactHeader(item).padding(.top, top)
                paneContent.frame(height: 360).padding(.top, gap)
            }
            PlayerScrubber().padding(.top, gap)
            transport(width: UIScreen.main.bounds.width).padding(.top, gap * 0.6)
            volume(width: UIScreen.main.bounds.width).padding(.top, gap * 0.6)
            bottomRow(width: UIScreen.main.bounds.width).padding(.top, gap * 0.6)
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 24)
        .padding(.top, 22)
        .padding(.bottom, 12)
    }

    private func artworkStage(_ item: QueueItem?, side: CGFloat) -> some View {
        let forward = model.lastMoveForward
        let slide: AnyTransition = (quietSwap || reduceMotion) ? .opacity
            : .asymmetric(insertion: .move(edge: forward ? .trailing : .leading).combined(with: .opacity),
                          removal: .move(edge: forward ? .leading : .trailing).combined(with: .opacity))
        return ZStack {
            CoverTile(image: model.currentArt, loading: model.loading)
                .drawingGroup()
                .matchedGeometryEffect(id: "art", in: morph)
                .id(item?.id ?? "none")
                .transition(slide)
        }
        .frame(width: side, height: side)
        .popupTransitionTarget()
        .scaleEffect(model.isPlaying || reduceMotion ? 1 : PlayerLayout.pausedScale)
        .overlay(alignment: .bottom) { if showHint { swipeHint.padding(.bottom, 10).transition(.opacity) } }
        .frame(maxWidth: .infinity)
        .animation(reduceMotion ? nil : .spring(duration: 0.4, bounce: 0.15), value: model.isPlaying)
        .animation(reduceMotion ? nil : .spring(duration: 0.45, bounce: 0.12), value: item?.id)
        .coverSwipe(reveal: reveal, itemID: item?.id ?? "none",
                    onBegin: { withAnimation(.easeOut(duration: 0.25)) { hintDismissed = true } },
                    onWillDislike: { quietSwap = true },
                    onCommit: commit)
        .onTapGesture(count: 2) { favorite() }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Album art")
        .accessibilityAddTraits(.isImage)
        .accessibilityAction(named: "Favorite") { favorite() }
        .accessibilityAction(named: "Suggest less") { model.feedback(.suggestLess) }
        .accessibilityAction(named: "Next song") { model.skip() }
        .accessibilityAction(named: "Previous song") { model.previous() }
    }

    private var showHint: Bool { !hintDismissed && !(likedBySwipe && dislikedBySwipe) }

    private var swipeHint: some View {
        Text("Swipe the cover — right to love, left to suggest less")
            .font(.caption.weight(.medium)).multilineTextAlignment(.center).captionBlock()
            .padding(.horizontal, 12).padding(.vertical, 6)
            .background(.ultraThinMaterial, in: .rect(cornerRadius: 14, style: .continuous))
            .padding(.horizontal, 10)
            .accessibilityHidden(true)
    }

    private func commit(_ action: SwipeAction) {
        switch action {
        case .like:
            likedBySwipe = true
            if !model.isFavorite(model.current) { favoriteTick += 1; model.feedback(.favorite) }
        case .dislike:
            dislikedBySwipe = true
            model.feedback(.suggestLess)
            Task { try? await Task.sleep(for: .seconds(2)); quietSwap = false }
        }
    }

    private func titleRow(_ item: QueueItem?) -> some View {
        let fav = model.isFavorite(item)
        let shown = item.map { model.display($0) }
        return HStack(alignment: .center, spacing: 4) {
            VStack(alignment: .leading, spacing: 0) {
                MarqueeText(text: shown?.title ?? "Finding something for you…", isActive: model.isPlaying, verticalPadding: 0)
                    .font(.title2.weight(.semibold))
                MarqueeText(text: shown?.artist ?? " ", isActive: model.isPlaying, verticalPadding: 0)
                    .font(.title3).foregroundStyle(.playerSecondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .id(item?.id ?? "none")
            .transition(.opacity)
            .animation(.easeInOut(duration: 0.25), value: item?.id)
            .accessibilityElement(children: .combine)

            Button { favorite() } label: {
                Image(systemName: fav ? "star.fill" : "star").font(.title3).frame(width: PlayerLayout.buttonSize, height: PlayerLayout.buttonSize)
            }
            .buttonStyle(PressableStyle())
            .accessibilityLabel("Favorite")
            .accessibilityValue(fav ? "On" : "Off")
            .accessibilityAddTraits(.isToggle)
            .symbolEffect(.bounce, value: favoriteTick)

            Menu {
                PlayerMenuItems(item: item) { feedbackTick += 1 }
            } label: {
                Image(systemName: "ellipsis").font(.title3).frame(width: PlayerLayout.buttonSize, height: PlayerLayout.buttonSize)
            }
            .accessibilityLabel("More")
        }
    }

    private func transport(width: CGFloat) -> some View {
        let cell = width * PlayerLayout.transportSpread
        return HStack(spacing: 0) {
            Button("Previous", systemImage: "backward.fill") { model.previous() }
                .font(.system(size: sideIcon)).frame(width: cell, height: 56)
            Button(model.isPlaying ? "Pause" : "Play", systemImage: model.isPlaying ? "pause.fill" : "play.fill") { model.togglePlay() }
                .font(.system(size: playIcon)).frame(width: cell, height: 72)
                .contentTransition(reduceMotion ? .identity : .symbolEffect(.replace.downUp))
            Button("Next", systemImage: "forward.fill") { model.skip() }
                .font(.system(size: sideIcon)).frame(width: cell, height: 56)
        }
        .labelStyle(.iconOnly).buttonStyle(PressableStyle())
        .haptic(.impact(weight: .light), trigger: model.isPlaying)
    }

    private func volume(width: CGFloat) -> some View {
        let bar = PlayerLayout.volumeBar
        return ZStack(alignment: .topLeading) {
            Image(systemName: "speaker.fill").font(.footnote).foregroundStyle(.playerSecondary)
                .position(x: width * PlayerLayout.volumeIconCenters.low, y: 14)
            SystemVolumeSlider().frame(width: width * (bar.upperBound - bar.lowerBound), height: 28)
                .position(x: width * (bar.lowerBound + bar.upperBound) / 2, y: 14)
            Image(systemName: "speaker.wave.3.fill").font(.footnote).foregroundStyle(.playerSecondary)
                .position(x: width * PlayerLayout.volumeIconCenters.high, y: 14)
        }
        .frame(width: width, height: 28)
        .accessibilityElement(children: .contain)
        .dimmedByReveal(reveal)
    }

    private func bottomRow(width: CGFloat) -> some View {
        let cell = width * PlayerLayout.bottomSpread
        return HStack(spacing: 0) {
            rowButton("Lyrics", "quote.bubble", active: pane == .lyrics, enabled: true) { toggle(.lyrics) }
                .frame(width: cell)
            AirPlayButton().frame(width: PlayerLayout.buttonSize, height: PlayerLayout.buttonSize).frame(width: cell)
                .accessibilityLabel("AirPlay")
            rowButton("Up next", "list.bullet", active: pane == .queue, enabled: true) { toggle(.queue) }
                .frame(width: cell)
        }
        .dimmedByReveal(reveal)
    }

    private func rowButton(_ title: String, _ icon: String, active: Bool, enabled: Bool,
                           _ action: @escaping () -> Void) -> some View {
        Button { feedbackTick += 1; action() } label: {
            Image(systemName: icon).font(.system(size: rowIcon)).frame(width: PlayerLayout.buttonSize, height: PlayerLayout.buttonSize)
                .background(active ? Color.white.opacity(0.28) : .clear, in: .circle)
        }
        .buttonStyle(PressableStyle())
        .foregroundStyle(active ? Color.white : .playerSecondary)
        .opacity(enabled ? 1 : 0.35)
        .disabled(!enabled)
        .accessibilityLabel(title)
    }

    private func favorite() { favoriteTick += 1; model.feedback(.favorite) }

    private func toggle(_ target: PlayerPane) { pane = pane == target ? .artwork : target }
}

private struct CoverTile: View {
    let image: UIImage?
    let loading: Bool
    var body: some View {
        Color(white: 0.16)
            .overlay {
                if let image { Image(uiImage: image).resizable().scaledToFill().transition(.opacity) }
                else if loading { ProgressView().tint(.white) }
                else { Image(systemName: "music.note").font(.system(size: 54)).foregroundStyle(.white.opacity(0.3)) }
            }
            .clipShape(.rect(cornerRadius: 12, style: .continuous))
            .shadow(color: .black.opacity(0.3), radius: 24, y: 12)
            .animation(.easeInOut(duration: 0.3), value: image != nil)
    }
}

private struct PlayerBackground: View {
    @Environment(AppModel.self) private var model
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    let reveal: SwipeReveal

    private static let points: [SIMD2<Float>] = [
        [0, 0], [0.5, 0], [1, 0], [0, 0.5], [0.5, 0.5], [1, 0.5], [0, 1], [0.5, 1], [1, 1],
    ]

    var body: some View {
        let palette = model.settings.tintedPlayer && model.artPalette.count == 9
            ? model.artPalette.map { UIImage.playerTint(from: $0) }
            : Array(repeating: Color(white: 0.12), count: 9)
        ZStack {
            MeshGradient(width: 3, height: 3, points: Self.points, colors: palette)
            SwipeBackdrop(reveal: reveal)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .clipped()
        .ignoresSafeArea()
        .animation(reduceMotion ? nil : .easeInOut(duration: 0.4), value: model.artPalette)
    }
}

private struct PlayerScrubber: View {
    @Environment(AppModel.self) private var model
    @State private var scrubbing: Double?

    var body: some View {
        let duration = model.duration
        let frac = scrubbing ?? (duration > 0 ? min(1, model.progress / duration) : 0)
        VStack(spacing: 4) {
            GeometryReader { g in
                ZStack(alignment: .leading) {
                    Capsule().fill(.white.opacity(0.25))
                    Capsule().fill(.white.opacity(0.7)).frame(width: max(PlayerLayout.barThickness, g.size.width * frac))
                }
                .frame(height: scrubbing == nil ? PlayerLayout.barThickness : PlayerLayout.barThickness + 4).frame(maxHeight: .infinity)
                .contentShape(.rect)
                .gesture(DragGesture(minimumDistance: 0)
                    .onChanged { scrubbing = min(1, max(0, $0.location.x / g.size.width)) }
                    .onEnded { v in model.seek(to: min(1, max(0, v.location.x / g.size.width))); scrubbing = nil })
                .animation(.snappy(duration: 0.2), value: scrubbing == nil)
            }.frame(height: 20)
            HStack(alignment: .firstTextBaseline) {
                Text(Self.clock(frac * duration)).monospacedDigit().frame(minWidth: 44, alignment: .leading)
                Spacer(minLength: 6)
                if let rate = model.currentBitrate {
                    Text("\(rate) kbps").font(.caption2.weight(.semibold)).padding(.horizontal, 8).padding(.vertical, 2)
                        .background(.white.opacity(0.12), in: .capsule)
                    Spacer(minLength: 6)
                }
                Text("−" + Self.clock(max(0, duration - frac * duration))).monospacedDigit().frame(minWidth: 44, alignment: .trailing)
            }
            .font(.playerMeta).foregroundStyle(.playerSecondary)
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Playback position")
        .accessibilityValue("\(Self.clock(frac * duration)) of \(Self.clock(duration))")
        .accessibilityAdjustableAction { direction in
            guard duration > 0 else { return }
            let step = 10 / duration
            switch direction {
            case .increment: model.seek(to: min(1, frac + step))
            case .decrement: model.seek(to: max(0, frac - step))
            @unknown default: break
            }
        }
    }

    private static func clock(_ s: Double) -> String { let v = Int(max(0, s)); return String(format: "%d:%02d", v / 60, v % 60) }
}
