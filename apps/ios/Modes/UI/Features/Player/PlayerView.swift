import LNPopupUI
import ModesCore
import SwiftUI

struct PlayerView: View {
    @Environment(AppModel.self) private var model
    @State private var showQueue = false
    @State private var favoriteTick = 0
    @State private var feedbackTick = 0
    @State private var reveal = SwipeReveal()
    @State private var hintDismissed = false
    @State private var quietSwap = false
    @AppStorage("hint.swipedLike") private var likedBySwipe = false
    @AppStorage("hint.swipedDislike") private var dislikedBySwipe = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @ScaledMetric(relativeTo: .title) private var sideIcon = 34
    @ScaledMetric(relativeTo: .title) private var playIcon = 56
    @ScaledMetric(relativeTo: .body) private var rowIcon = 24
    @ScaledMetric(relativeTo: .body) private var rowTarget = 52

    @Environment(\.dynamicTypeSize) private var typeSize

    var body: some View {
        GeometryReader { geo in
            let height = geo.size.height
            let side = max(120, min(geo.size.width - 48, height * 0.44))
            ViewThatFits(in: .vertical) {
                column(side: side, gap: max(10, height * 0.028))
                    .fixedSize(horizontal: false, vertical: true)
                ScrollView { column(side: side, gap: 18) }
                    .scrollBounceBehavior(.basedOnSize)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
            .background { PlayerBackground(reveal: reveal) }
            .overlay(alignment: .bottom) { ToastView(text: model.toast).padding(.bottom, 24) }
        }
        .environment(\.colorScheme, .dark)
        .tint(.white)
        .foregroundStyle(.white)
        .sheet(isPresented: $showQueue) { UpNextView().presentationDetents([.medium, .large]) }
        .sensoryFeedback(.success, trigger: favoriteTick)
        .sensoryFeedback(.impact(weight: .medium), trigger: feedbackTick)
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

    private func column(side: CGFloat, gap: CGFloat) -> some View {
        let item = model.current
        return VStack(spacing: 0) {
            SleepTimerBadge().padding(.top, 4)
            artworkStage(item, side: side).padding(.top, gap)
            titleRow(item).padding(.top, gap)
            PlayerScrubber(why: item?.why).padding(.top, gap * 0.8)
            transport.padding(.top, gap * 0.5)
            volume.padding(.top, gap * 0.4)
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
        .scaleEffect(model.isPlaying ? 1 : 0.84)
        .overlay(alignment: .bottom) { if showHint { swipeHint.padding(.bottom, 10).transition(.opacity) } }
        .frame(maxWidth: .infinity)
        .animation(.spring(duration: 0.5, bounce: 0.3), value: model.isPlaying)
        .animation(.spring(duration: 0.45, bounce: 0.12), value: item?.id)
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
        return HStack(alignment: .center, spacing: 12) {
            VStack(alignment: .leading, spacing: 5) {
                MarqueeText(text: shown?.title ?? "Finding something for you…", isActive: model.isPlaying).font(.playerTitle)
                MarqueeText(text: shown?.artist ?? " ", isActive: model.isPlaying).font(.playerArtist).foregroundStyle(.playerSecondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .id(item?.id ?? "none")
            .transition(.opacity)
            .animation(.easeInOut(duration: 0.25), value: item?.id)
            .accessibilityElement(children: .combine)

            Button(fav ? "Remove favorite" : "Favorite", systemImage: fav ? "heart.fill" : "heart") { favorite() }
                .labelStyle(.iconOnly).buttonStyle(PressableStyle())
                .font(.headline).foregroundStyle(fav ? Color.brand : .white)
                .frame(width: 44, height: 44).glassEffect(.regular.interactive(), in: .circle)
                .symbolEffect(.bounce, value: favoriteTick)

            Menu {
                PlayerMenuItems(item: item) { feedbackTick += 1 }
            } label: {
                Image(systemName: "ellipsis").font(.headline).frame(width: 44, height: 44)
                    .glassEffect(.regular.interactive(), in: .circle)
            }
            .accessibilityLabel("More options")
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
                .contentTransition(.symbolEffect(.replace.downUp))
            Spacer()
            Button("Next", systemImage: "forward.fill") { model.skip() }
                .font(.system(size: sideIcon)).frame(minWidth: 56, minHeight: 56)
            Spacer()
        }
        .labelStyle(.iconOnly).buttonStyle(PressableStyle())
        .sensoryFeedback(.impact(weight: .light), trigger: model.isPlaying)
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
        let layout = typeSize.isAccessibilitySize ? AnyLayout(VStackLayout(spacing: 16)) : AnyLayout(HStackLayout(alignment: .top, spacing: 8))
        return layout {
            VStack(spacing: 4) {
                AirPlayButton().frame(width: rowTarget, height: rowTarget).accessibilityLabel("AirPlay")
                Text("AirPlay").font(.caption).foregroundStyle(.playerSecondary)
            }.frame(maxWidth: .infinity)
            rowButton("Up next", "list.bullet") { showQueue = true }
                .frame(maxWidth: .infinity)
        }
        .dimmedByReveal(reveal)
    }

    private func rowButton(_ title: String, _ icon: String, _ action: @escaping () -> Void) -> some View {
        Button { feedbackTick += 1; action() } label: {
            VStack(spacing: 4) {
                Image(systemName: icon).font(.system(size: rowIcon, weight: .regular))
                    .frame(minWidth: rowTarget, minHeight: rowTarget)
                Text(title).font(.caption).foregroundStyle(.playerSecondary)
                    .multilineTextAlignment(.center).fixedSize(horizontal: false, vertical: true)
            }
        }
        .buttonStyle(PressableStyle())
        .foregroundStyle(.white.opacity(0.85))
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
            .shadow(color: .black.opacity(0.45), radius: 26, y: 16)
            .animation(.easeInOut(duration: 0.3), value: image != nil)
    }
}

private struct PlayerBackground: View {
    @Environment(AppModel.self) private var model
    let reveal: SwipeReveal

    static func dimming(forAverage color: UIColor?) -> Double {
        guard let color else { return 0.5 }
        var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
        color.getRed(&r, green: &g, blue: &b, alpha: &a)
        let luma = 0.2126 * Double(r) + 0.7152 * Double(g) + 0.0722 * Double(b)
        return 0.42 + 0.23 * min(1, max(0, luma))
    }

    var body: some View {
        let tint: Color = model.artTint.map { UIImage.backdrop(from: $0, brightness: 0.42) } ?? Color(white: 0.2)
        ZStack {
            LinearGradient(stops: [.init(color: tint, location: 0), .init(color: tint.opacity(0.6), location: 0.5), .init(color: .black, location: 1)],
                           startPoint: .top, endPoint: .bottom)
            if let art = model.currentArt {
                ZStack {
                    Image(uiImage: art).resizable().scaledToFill()
                    Color.black.opacity(Self.dimming(forAverage: model.artTint))
                }
                .compositingGroup().blur(radius: 80, opaque: true)
                .transition(.opacity)
            }
            LinearGradient(colors: [.clear, .black.opacity(0.45)], startPoint: .center, endPoint: .bottom)
            SwipeBackdrop(reveal: reveal)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .clipped()
        .ignoresSafeArea()
        .animation(.easeInOut(duration: 0.7), value: model.currentArt != nil)
        .animation(.easeInOut(duration: 0.7), value: model.artTint)
    }
}

private struct PlayerScrubber: View {
    @Environment(AppModel.self) private var model
    let why: String?
    @State private var scrubbing: Double?

    var body: some View {
        let duration = model.duration
        let frac = scrubbing ?? (duration > 0 ? min(1, model.progress / duration) : 0)
        VStack(spacing: 6) {
            GeometryReader { g in
                ZStack(alignment: .leading) {
                    Capsule().fill(.white.opacity(0.28))
                    Capsule().fill(.white.opacity(0.92)).frame(width: max(7, g.size.width * frac))
                }
                .frame(height: scrubbing == nil ? 7 : 13).frame(maxHeight: .infinity)
                .contentShape(.rect)
                .gesture(DragGesture(minimumDistance: 0)
                    .onChanged { scrubbing = min(1, max(0, $0.location.x / g.size.width)) }
                    .onEnded { v in model.seek(to: min(1, max(0, v.location.x / g.size.width))); scrubbing = nil })
                .animation(.snappy(duration: 0.2), value: scrubbing == nil)
            }.frame(height: 22)
            HStack(alignment: .firstTextBaseline) {
                Text(Self.clock(frac * duration)).monospacedDigit().frame(minWidth: 44, alignment: .leading)
                Spacer(minLength: 6)
                if let why { Label(why, systemImage: "sparkle").labelStyle(.titleAndIcon).font(.playerMetaStrong).lineLimit(1).truncationMode(.tail) }
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
