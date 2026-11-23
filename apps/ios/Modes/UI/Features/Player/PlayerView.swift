import LNPopupUI
import ModesCore
import SwiftUI

struct PlayerView: View {
    @Environment(AppModel.self) private var model
    @State private var showQueue = false
    @State private var showLyrics = false
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
                    ScrollView { column(side: geo.size.width * 0.64, gap: 18, top: 8) }
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
        .sheet(isPresented: $showQueue) { UpNextView().presentationDetents([.medium, .large]) }
        .sheet(isPresented: $showLyrics) { LyricsView().presentationDetents([.medium, .large]) }
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

    private enum Slot {
        static let artwork = 0.3155
        static let title = 0.586
        static let progress = 0.679
        static let transport = 0.773
        static let volume = 0.877
        static let bottom = 0.938
        static let artworkHeight = 0.299
    }

    private func proportional(_ geo: GeometryProxy) -> some View {
        let item = model.current
        let inset = geo.safeAreaInsets
        let screen = geo.size.height + inset.top + inset.bottom
        let width = geo.size.width - 48
        let side = min(geo.size.width * 0.64, screen * Slot.artworkHeight)
        func place<Content: View>(_ slot: Double, @ViewBuilder _ content: () -> Content) -> some View {
            content().frame(width: width).position(x: geo.size.width / 2, y: slot * screen - inset.top)
        }
        return ZStack(alignment: .topLeading) {
            SleepTimerBadge().frame(maxWidth: .infinity)
            artworkStage(item, side: side).frame(width: geo.size.width).position(x: geo.size.width / 2, y: Slot.artwork * screen - inset.top)
            place(Slot.title) { titleRow(item) }
            place(Slot.progress) { PlayerScrubber() }
            place(Slot.transport) { transport }
            place(Slot.volume) { volume }
            place(Slot.bottom) { bottomRow }
        }
        .frame(width: geo.size.width, height: geo.size.height, alignment: .topLeading)
    }

    private func column(side: CGFloat, gap: CGFloat, top: CGFloat) -> some View {
        let item = model.current
        return VStack(spacing: 0) {
            SleepTimerBadge()
            artworkStage(item, side: side).padding(.top, top)
            titleRow(item).padding(.top, gap * 1.5)
            PlayerScrubber().padding(.top, gap)
            transport.padding(.top, gap * 0.6)
            volume.padding(.top, gap * 0.6)
            bottomRow.padding(.top, gap * 0.6)
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
                .id(item?.id ?? "none")
                .transition(slide)
        }
        .frame(width: side, height: side)
        .popupTransitionTarget()
        .scaleEffect(model.isPlaying || reduceMotion ? 1 : 0.8)
        .overlay(alignment: .bottom) { if showHint { swipeHint.padding(.bottom, 10).transition(.opacity) } }
        .frame(maxWidth: .infinity)
        .animation(reduceMotion ? nil : .spring(duration: 0.5, bounce: 0.25), value: model.isPlaying)
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
            VStack(alignment: .leading, spacing: 2) {
                MarqueeText(text: shown?.title ?? "Finding something for you…", isActive: model.isPlaying)
                    .font(.title2.weight(.semibold))
                MarqueeText(text: shown?.artist ?? " ", isActive: model.isPlaying)
                    .font(.title3).foregroundStyle(.playerSecondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .id(item?.id ?? "none")
            .transition(.opacity)
            .animation(.easeInOut(duration: 0.25), value: item?.id)
            .accessibilityElement(children: .combine)

            Button { favorite() } label: {
                Image(systemName: fav ? "star.fill" : "star").font(.title3).frame(width: 44, height: 44)
            }
            .buttonStyle(PressableStyle())
            .accessibilityLabel("Favorite")
            .accessibilityValue(fav ? "On" : "Off")
            .accessibilityAddTraits(.isToggle)
            .symbolEffect(.bounce, value: favoriteTick)

            Menu {
                PlayerMenuItems(item: item) { feedbackTick += 1 }
            } label: {
                Image(systemName: "ellipsis").font(.title3).frame(width: 44, height: 44)
            }
            .accessibilityLabel("More")
        }
    }

    private var transport: some View {
        HStack(spacing: 0) {
            Spacer()
            Button("Previous", systemImage: "backward.fill") { model.previous() }
                .font(.system(size: sideIcon)).frame(minWidth: 56, minHeight: 56)
            Spacer()
            Button(model.isPlaying ? "Pause" : "Play", systemImage: model.isPlaying ? "pause.fill" : "play.fill") { model.togglePlay() }
                .font(.system(size: playIcon)).frame(minWidth: 72, minHeight: 72)
                .contentTransition(reduceMotion ? .identity : .symbolEffect(.replace.downUp))
            Spacer()
            Button("Next", systemImage: "forward.fill") { model.skip() }
                .font(.system(size: sideIcon)).frame(minWidth: 56, minHeight: 56)
            Spacer()
        }
        .labelStyle(.iconOnly).buttonStyle(PressableStyle())
        .haptic(.impact(weight: .light), trigger: model.isPlaying)
    }

    private var volume: some View {
        HStack(spacing: 12) {
            Image(systemName: "speaker.fill").font(.footnote).foregroundStyle(.playerSecondary)
            SystemVolumeSlider().frame(height: 28)
            Image(systemName: "speaker.wave.3.fill").font(.footnote).foregroundStyle(.playerSecondary)
        }
        .accessibilityElement(children: .contain)
        .dimmedByReveal(reveal)
    }

    private var bottomRow: some View {
        HStack {
            rowButton("Lyrics", "quote.bubble", active: showLyrics, enabled: model.currentHasLyrics) { showLyrics = true }
            AirPlayButton().frame(width: 44, height: 44).frame(maxWidth: .infinity).accessibilityLabel("AirPlay")
            rowButton("Up next", "list.bullet", active: showQueue, enabled: true) { showQueue = true }
        }
        .dimmedByReveal(reveal)
    }

    private func rowButton(_ title: String, _ icon: String, active: Bool, enabled: Bool,
                           _ action: @escaping () -> Void) -> some View {
        Button { feedbackTick += 1; action() } label: {
            Image(systemName: icon).font(.system(size: rowIcon)).frame(width: 44, height: 44)
        }
        .buttonStyle(PressableStyle())
        .frame(maxWidth: .infinity)
        .foregroundStyle(active ? Color.white : .playerSecondary)
        .opacity(enabled ? 1 : 0.35)
        .disabled(!enabled)
        .accessibilityLabel(title)
    }

    private func favorite() { favoriteTick += 1; model.feedback(.favorite) }
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
    let reveal: SwipeReveal

    var body: some View {
        let tint = model.settings.tintedPlayer ? (model.artTint.map { UIImage.playerTint(from: $0) } ?? Color(white: 0.2)) : Color(white: 0.12)
        ZStack {
            LinearGradient(colors: [tint, tint.opacity(0.78), Color.black.opacity(0.55)], startPoint: .top, endPoint: .bottom)
                .background(tint)
            SwipeBackdrop(reveal: reveal)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .clipped()
        .ignoresSafeArea()
        .animation(.easeInOut(duration: 0.4), value: model.artTint)
    }
}

private struct PlayerScrubber: View {
    @Environment(AppModel.self) private var model
    @State private var scrubbing: Double?

    var body: some View {
        let duration = model.duration
        let frac = scrubbing ?? (duration > 0 ? min(1, model.progress / duration) : 0)
        VStack(spacing: 2) {
            GeometryReader { g in
                ZStack(alignment: .leading) {
                    Capsule().fill(.white.opacity(0.25))
                    Capsule().fill(.white.opacity(0.7)).frame(width: max(5, g.size.width * frac))
                }
                .frame(height: scrubbing == nil ? 5 : 9).frame(maxHeight: .infinity)
                .contentShape(.rect)
                .gesture(DragGesture(minimumDistance: 0)
                    .onChanged { scrubbing = min(1, max(0, $0.location.x / g.size.width)) }
                    .onEnded { v in model.seek(to: min(1, max(0, v.location.x / g.size.width))); scrubbing = nil })
                .animation(.snappy(duration: 0.2), value: scrubbing == nil)
            }.frame(height: 20)
            HStack(alignment: .firstTextBaseline) {
                Text(Self.clock(frac * duration)).monospacedDigit().frame(minWidth: 44, alignment: .leading)
                Spacer(minLength: 6)
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
