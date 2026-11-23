import ModesCore
import SwiftUI

struct SongListRow: View {
    enum Style { case artwork, track }

    @Environment(AppModel.self) private var model
    @Environment(\.layoutDirection) private var layoutDirection
    @Environment(\.metrics) private var metrics
    @AppStorage(SongSwipePreference.enabled) private var swipesEnabled = true
    @AppStorage(SongSwipePreference.leading) private var leading = SongSwipeAction.favorite
    @AppStorage(SongSwipePreference.trailing) private var trailing = SongSwipeAction.playNext
    @AppStorage(SongSwipePreference.fullSwipe) private var fullSwipe = true
    @State private var actionTick = 0
    @State private var addingToPlaylist = false

    let source: SongReference

    var context: [SongReference] = []
    var number: Int? = nil
    var detail: String? = nil
    var style: Style = .artwork

    var body: some View {
        let item = model.songItem(for: source)
        let display = model.display(item)
        let isCurrent = model.current?.id == item.id
        HStack(spacing: 0) {
            Button { model.playSong(source, in: context) } label: {
                HStack(spacing: metrics.gap) {
                    if style == .track {
                        trackNumber(number, current: isCurrent).frame(width: 22 * metrics.unit)
                    } else {
                        Artwork(url: model.artURL(item), radius: metrics.rowRadius).frame(width: metrics.rowArtwork, height: metrics.rowArtwork)
                    }
                    VStack(alignment: .leading, spacing: 1) {
                        Text(display.title).font(.amRowTitle).lineLimit(1)
                        let subtitle = [detail, display.compactArtist].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: " · ")
                        if !subtitle.isEmpty {
                            Text(subtitle).font(style == .track ? .footnote : .amRowSubtitle).foregroundStyle(.secondary)
                                .lineLimit(style == .track ? 2 : 1).multilineTextAlignment(.leading)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
                .contentShape(.rect)
            }
            .buttonStyle(RowPressStyle())
            .accessibilityHint("Plays this song")

            Menu {
                menuActions(for: item)
            } label: {
                Image(systemName: "ellipsis").font(.body).foregroundStyle(.secondary).frame(width: 44, height: 44).contentShape(.rect)
            }
            .accessibilityLabel("Options for \(display.title)")
        }
        .padding(.vertical, style == .track ? 3 : 6)
        .swipeActions(edge: layoutDirection == .leftToRight ? .leading : .trailing, allowsFullSwipe: fullSwipe) { swipeButton(leading, item: item) }
        .swipeActions(edge: layoutDirection == .leftToRight ? .trailing : .leading, allowsFullSwipe: fullSwipe) { swipeButton(trailing, item: item) }
        .contextMenu { menuActions(for: item) } preview: { SongPreviewCard(item: item) }
        .sheet(isPresented: $addingToPlaylist) { PlaylistPicker(source: source) }
        .haptic(.selection, trigger: actionTick)
        .listRowBackground(Color.clear)
        .listRowSeparator(.hidden)
        .alignmentGuide(.listRowSeparatorLeading) { _ in 0 }
        .listRowInsets(EdgeInsets(top: 0, leading: metrics.inset, bottom: 0, trailing: 4))
        .overlay(alignment: .bottom) {
            Rectangle().fill(Color(.separator).opacity(0.6)).frame(height: 1 / 3)
                .padding(.leading, style == .track ? 22 * metrics.unit + metrics.gap : metrics.rowArtwork + metrics.gap)
        }
    }

    @ViewBuilder private func trackNumber(_ number: Int?, current: Bool) -> some View {
        if current {
            Image(systemName: "waveform").font(.footnote).symbolEffect(.variableColor.iterative, isActive: model.isPlaying)
                .foregroundStyle(.secondary)
        } else if let number {
            Text(number, format: .number).font(.body.monospacedDigit()).foregroundStyle(.secondary)
        }
    }

    @ViewBuilder private func menuActions(for item: QueueItem) -> some View {
        let shown = model.display(item)
        ControlGroup {
            Button("Add", systemImage: "plus") { addingToPlaylist = true }
            Button("Favorite", systemImage: model.isFavorite(item) ? "star.fill" : "star") { perform(.favorite) }
            if let url = PlayerMenuItems.searchURL(title: shown.title, artist: shown.artist) {
                ShareLink(item: url) { Label("Share", systemImage: "square.and.arrow.up") }
            }
        }
        Button("Add to Playlist", systemImage: "text.badge.plus") { addingToPlaylist = true }
        Button("Play Next", systemImage: SongSwipeAction.playNext.icon) { perform(.playNext) }
        Button("Play Last", systemImage: "text.line.last.and.arrowtriangle.forward") { model.queueSongLast(source) }
        if model.settings.labs.radioStations {
            Button("Create Station", systemImage: "dot.radiowaves.left.and.right") { model.startStation(for: source) }
        }
        if let albumID = model.albumID(item) {
            NavigationLink(value: MusicRoute.album(albumID)) { Label("Go to Album", systemImage: "square.stack") }
        }
        if let artistID = model.artistID(item) {
            NavigationLink(value: MusicRoute.artist(artistID)) { Label("Go to Artist", systemImage: "music.mic") }
        }
        Button("Suggest Less", systemImage: "hand.thumbsdown", role: .destructive) { model.rejectSong(source) }
    }

    @ViewBuilder private func swipeButton(_ action: SongSwipeAction, item: QueueItem) -> some View {
        if swipesEnabled, action != .none {
            Button(action == .favorite ? favoriteTitle(item) : action.title,
                   systemImage: action == .favorite && model.isFavorite(item) ? "star.slash" : action.icon) { perform(action) }
                .tint(action.tint)
        }
    }

    private func favoriteTitle(_ item: QueueItem) -> String { model.isFavorite(item) ? "Remove favorite" : "Favorite" }

    private func perform(_ action: SongSwipeAction) {
        actionTick += 1
        switch action {
        case .favorite: model.toggleSongFavorite(source)
        case .playNext: model.queueSongNext(source)
        case .playNow: model.playSong(source, in: context)
        case .none: break
        }
    }
}
