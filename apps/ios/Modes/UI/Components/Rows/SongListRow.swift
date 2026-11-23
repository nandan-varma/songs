import ModesCore
import SwiftUI

struct SongListRow: View {
    @Environment(AppModel.self) private var model
    @Environment(\.layoutDirection) private var layoutDirection
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

    var body: some View {
        let item = model.songItem(for: source)
        HStack(spacing: 8) {
            Button { model.playSong(source, in: context) } label: {
                HStack(spacing: 10) {
                    if let number {
                        Text(number, format: .number).font(.caption.monospacedDigit())
                            .foregroundStyle(.secondary).frame(minWidth: 18, alignment: .leading)
                    }
                    VStack(alignment: .leading, spacing: 4) {
                        SongRowContent(artworkURL: model.artURL(item), display: model.display(item)) { EmptyView() }
                        if let detail {
                            Text(detail).font(.caption).foregroundStyle(.secondary)
                                .fixedSize(horizontal: false, vertical: true).padding(.leading, MusicLayout.rowArtwork + MusicLayout.rowSpacing)
                        }
                    }
                }.contentShape(.rect)
            }
            .buttonStyle(.plain)
            .accessibilityHint("Plays this song")
            .frame(maxWidth: .infinity, alignment: .leading)

            Menu("Song options", systemImage: "ellipsis") {
                menuActions(for: item)
            }
            .labelStyle(.iconOnly)
            .font(.body.weight(.semibold))
            .foregroundStyle(.secondary)
            .frame(width: 44, height: 44)
            .accessibilityLabel("Options for \(model.display(item).title)")
        }
        .padding(.vertical, 4)
        .swipeActions(edge: layoutDirection == .leftToRight ? .leading : .trailing, allowsFullSwipe: fullSwipe) { swipeButton(leading, item: item) }
        .swipeActions(edge: layoutDirection == .leftToRight ? .trailing : .leading, allowsFullSwipe: fullSwipe) { swipeButton(trailing, item: item) }
        .contextMenu { menuActions(for: item) }
        .sheet(isPresented: $addingToPlaylist) { PlaylistPicker(source: source) }
        .haptic(.selection, trigger: actionTick)
        .listRowBackground(Color.clear)
        .listRowInsets(EdgeInsets(top: 2, leading: MusicLayout.pageInset, bottom: 2, trailing: 12))
    }

    @ViewBuilder private func menuActions(for item: QueueItem) -> some View {
        Button("Play now", systemImage: "play.fill") { perform(.playNow) }
        Button("Play next", systemImage: SongSwipeAction.playNext.icon) { perform(.playNext) }
        Button("Play last", systemImage: "text.line.last.and.arrowtriangle.forward") { model.queueSongLast(source) }
        Button(favoriteTitle(item), systemImage: model.isFavorite(item) ? "heart.slash" : "heart") { perform(.favorite) }
        Button("Add to playlist", systemImage: "text.badge.plus") { addingToPlaylist = true }
        if let albumID = model.albumID(item) {
            NavigationLink("Go to album", value: MusicRoute.album(albumID))
        }
        if let artistID = model.artistID(item) {
            NavigationLink("Go to artist", value: MusicRoute.artist(artistID))
        }
        if let url = PlayerMenuItems.searchURL(title: model.display(item).title, artist: model.display(item).artist) {
            ShareLink("Share song", item: url)
        }
    }

    @ViewBuilder private func swipeButton(_ action: SongSwipeAction, item: QueueItem) -> some View {
        if swipesEnabled, action != .none {
            Button(action == .favorite ? favoriteTitle(item) : action.title,
                   systemImage: action == .favorite && model.isFavorite(item) ? "heart.slash" : action.icon) { perform(action) }
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
