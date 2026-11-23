import ModesCore
import SwiftUI

struct PlaylistRow: View {
    let playlist: LocalPlaylist
    @Environment(\.metrics) private var metrics

    var body: some View {
        ZStack {
            HStack(spacing: metrics.gap) {
                PlaylistThumb(playlist: playlist).frame(width: metrics.rowArtwork, height: metrics.rowArtwork)
                VStack(alignment: .leading, spacing: 1) {
                    Text(playlist.name).font(.amRowTitle).lineLimit(1)
                    Text("\(playlist.songs.count) \(playlist.songs.count == 1 ? "song" : "songs")").font(.amRowSubtitle).foregroundStyle(.secondary)
                }
                Spacer(minLength: 0)
                Image(systemName: "chevron.right").font(.footnote.weight(.semibold)).foregroundStyle(.tertiary)
            }
            NavigationLink(value: LibraryRoute.playlist(playlist.id)) { EmptyView() }.opacity(0)
        }
        .padding(.vertical, 6)
        .listRowBackground(Color.clear).listRowSeparator(.hidden)
        .listRowInsets(EdgeInsets(top: 0, leading: metrics.inset, bottom: 0, trailing: metrics.inset))
        .overlay(alignment: .bottom) {
            Rectangle().fill(Color(.separator).opacity(0.6)).frame(height: 1 / 3).padding(.leading, metrics.rowArtwork + metrics.gap)
        }
    }
}
