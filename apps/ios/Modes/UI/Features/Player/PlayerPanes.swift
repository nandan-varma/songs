import ModesCore
import SwiftUI

enum PlayerPane { case artwork, lyrics, queue }

struct CompactHeader<Trailing: View>: View {
    @Environment(AppModel.self) private var model
    @Environment(\.metrics) private var metrics
    let item: QueueItem?
    let morph: Namespace.ID
    @ViewBuilder var trailing: Trailing

    var body: some View {
        let shown = item.map { model.display($0) }
        HStack(spacing: metrics.gap) {
            Artwork(url: item.flatMap { model.artURL($0) }, radius: 6).frame(width: 52 * metrics.unit, height: 52 * metrics.unit)
                .shadow(color: .black.opacity(0.3), radius: 8, y: 4)
                .matchedGeometryEffect(id: "art", in: morph)
            VStack(alignment: .leading, spacing: 0) {
                Text(shown?.title ?? "").font(.body.weight(.semibold)).lineLimit(1)
                Text(shown?.compactArtist ?? "").font(.body).foregroundStyle(.playerSecondary).lineLimit(1)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            trailing
        }
    }
}

struct LyricsPane: View {
    @Environment(AppModel.self) private var model
    @State private var synced: SaavnAPI.SyncedLyrics?
    @State private var plain: String?
    @State private var loaded = false

    var body: some View {
        Group {
            if let synced, !synced.lines.isEmpty {
                SyncedLines(lines: synced.lines)
            } else if let plain {
                ScrollView {
                    Text(plain).font(.title2.weight(.bold)).frame(maxWidth: .infinity, alignment: .leading).padding(.vertical, 24)
                }
                .scrollIndicators(.hidden)
            } else if loaded {
                ContentUnavailableView("No lyrics for this song", systemImage: "quote.bubble")
            } else {
                ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .task(id: model.current?.id) {
            guard let item = model.current else { return }
            loaded = false; synced = nil; plain = nil
            async let timed = model.syncedLyrics(for: item)
            async let text = model.lyrics(for: item.id)
            synced = await timed
            plain = synced == nil ? await text : nil
            loaded = true
        }
    }
}

private struct SyncedLines: View {
    @Environment(AppModel.self) private var model
    let lines: [SaavnAPI.SyncedLine]

    private var active: Int {
        let time = model.progress + 0.25
        return lines.lastIndex { $0.time <= time } ?? -1
    }

    var body: some View {
        let current = active
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 18) {
                    ForEach(Array(lines.enumerated()), id: \.offset) { index, line in
                        let distance = abs(index - current)
                        Button { model.seek(toSeconds: line.time) } label: {
                            Text(line.text.isEmpty ? "•••" : line.text)
                                .font(.title.weight(.bold)).multilineTextAlignment(.leading)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .opacity(index == current ? 1 : (index < current ? 0.3 : 0.45))
                                .blur(radius: index == current ? 0 : min(CGFloat(distance), 3) * 0.7)
                                .scaleEffect(index == current ? 1 : 0.96, anchor: .leading)
                        }
                        .buttonStyle(.plain)
                        .id(index)
                    }
                }
                .padding(.vertical, 40)
            }
            .scrollIndicators(.hidden)
            .onChange(of: current) { _, new in
                guard new >= 0 else { return }
                withAnimation(.easeInOut(duration: 0.55)) { proxy.scrollTo(new, anchor: UnitPoint(x: 0.5, y: 0.3)) }
            }
        }
        .mask(LinearGradient(stops: [.init(color: .clear, location: 0), .init(color: .black, location: 0.06),
                                     .init(color: .black, location: 0.9), .init(color: .clear, location: 1)],
                             startPoint: .top, endPoint: .bottom))
    }
}

struct QueuePane: View {
    @Environment(AppModel.self) private var model
    @Environment(\.metrics) private var metrics

    var body: some View {
        let queue = model.upNext
        let context = queue.map { SongReference.queued($0) }
        VStack(alignment: .leading, spacing: 14 * metrics.unit) {
            HStack(spacing: metrics.gap) {
                pill("arrow.triangle.2.circlepath", on: false, label: "Refresh") { Task { await model.refreshUpNext() } }
                pill(model.repeatSong ? "repeat.1" : "repeat", on: model.repeatSong, label: "Repeat") { model.repeatSong.toggle() }
                pill("infinity", on: model.settings.autoplay, label: "Autoplay") { model.settings.autoplay.toggle() }
            }
            VStack(alignment: .leading, spacing: 1) {
                Text("Continue Playing").font(.subheadline.weight(.semibold))
                if let from = model.current.flatMap({ model.display($0).context }) {
                    Text("From \(from)").font(.caption).foregroundStyle(.playerSecondary).lineLimit(1)
                }
            }
            List {
                ForEach(queue) { item in
                    row(item, context: context)
                        .listRowBackground(Color.clear)
                        .listRowSeparator(.hidden)
                        .listRowInsets(EdgeInsets(top: 0, leading: 0, bottom: 0, trailing: 0))
                        .deleteDisabled(true)
                }
                .onMove { model.moveUpNext(from: $0, to: $1) }
            }
            .listStyle(.plain)
            .scrollContentBackground(.hidden)
            .environment(\.editMode, .constant(.active))
            .scrollIndicators(.hidden)
            .animation(.snappy(duration: 0.3), value: queue.map(\.id))
        }
    }

    private func row(_ item: QueueItem, context: [SongReference]) -> some View {
        let shown = model.display(item)
        let side = 44 * metrics.unit
        return Button { model.playSong(.queued(item), in: context) } label: {
            HStack(spacing: metrics.gap) {
                Artwork(url: model.artURL(item), radius: side * 0.07).frame(width: side, height: side)
                VStack(alignment: .leading, spacing: 1) {
                    Text(shown.title).font(.callout).lineLimit(1)
                    Text(model.settings.showWhy ? shown.compactArtist + " · " + item.why : shown.compactArtist)
                        .font(.caption).foregroundStyle(.playerSecondary).lineLimit(1)
                }
                Spacer(minLength: 0)
            }
            .padding(.vertical, 6)
            .contentShape(.rect)
        }
        .buttonStyle(.plain)
        .overlay(alignment: .bottom) { Rectangle().fill(.white.opacity(0.12)).frame(height: 1 / 3).padding(.leading, side + metrics.gap) }
        .contextMenu {
            Button("Play next", systemImage: "text.line.first.and.arrowtriangle.forward") { model.queueSongNext(.queued(item)) }
            Button("Remove from Up Next", systemImage: "minus.circle", role: .destructive) { model.removeFromUpNext(item.id) }
        }
        .accessibilityAction(named: "Remove from Up Next") { model.removeFromUpNext(item.id) }
    }

    private func pill(_ icon: String, on: Bool, label: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: icon).font(.callout.weight(.semibold)).frame(maxWidth: .infinity, minHeight: 34 * metrics.unit)
                .foregroundStyle(.white)
                .background(Color.white.opacity(on ? 0.34 : 0.14), in: .capsule)
        }
        .buttonStyle(.plain)
        .accessibilityLabel(label)
        .accessibilityAddTraits(on ? .isSelected : [])
    }
}
