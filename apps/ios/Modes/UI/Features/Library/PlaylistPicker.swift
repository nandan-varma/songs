import ModesCore
import SwiftUI

struct PlaylistPicker: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    @Environment(\.metrics) private var metrics
    let source: SongReference

    @State private var query = ""
    @State private var creating = false
    @State private var sortByName = false

    private var playlists: [LocalPlaylist] {
        let all = sortByName ? model.playlists.sorted { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending } : model.playlists
        return query.isEmpty ? all : all.filter { $0.name.localizedCaseInsensitiveContains(query) }
    }

    var body: some View {
        NavigationStack {
            ZStack(alignment: .bottomLeading) {
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 0) {
                        searchField.padding(.horizontal, metrics.inset).padding(.bottom, 12)
                        if query.isEmpty, model.playlists.count > 3 { section("Recents", Array(model.playlists.prefix(3))) }
                        section(query.isEmpty && model.playlists.count > 3 ? "All Playlists" : nil, playlists)
                        if model.playlists.isEmpty {
                            ContentUnavailableView("No playlists yet", systemImage: "music.note.list", description: Text("Tap + to create one."))
                        }
                    }
                    .padding(.bottom, 110)
                }
                Menu {
                    Button("New Playlist", systemImage: "music.note.list") { creating = true }
                } label: {
                    Image(systemName: "plus").font(.title3.weight(.semibold)).frame(width: 56, height: 56).glassEffect(.regular.interactive(), in: .circle)
                }
                .padding(metrics.inset)
            }
            .navigationTitle("Add to Playlist").navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) { Button("Close", systemImage: "xmark") { dismiss() } }
                ToolbarItem(placement: .topBarTrailing) {
                    Menu("Sort", systemImage: "arrow.up.arrow.down") {
                        Picker("Sort", selection: $sortByName) { Text("Recently Added").tag(false); Text("Title").tag(true) }
                    }
                }
            }
            .sheet(isPresented: $creating) {
                NewPlaylistSheet(source: source) { dismiss() }
            }
        }
        .presentationDetents([.large])
    }

    private var searchField: some View {
        HStack(spacing: 8) {
            Image(systemName: "magnifyingglass").foregroundStyle(.secondary)
            TextField("Find in Playlists", text: $query)
            if !query.isEmpty { Button("Clear", systemImage: "xmark.circle.fill") { query = "" }.labelStyle(.iconOnly).foregroundStyle(.secondary) }
        }
        .padding(.horizontal, 12).frame(height: 40).background(Color(.tertiarySystemFill), in: .rect(cornerRadius: 12, style: .continuous))
    }

    @ViewBuilder private func section(_ title: String?, _ items: [LocalPlaylist]) -> some View {
        if !items.isEmpty {
            if let title { Text(title).font(.subheadline.weight(.semibold)).foregroundStyle(.secondary).padding(.horizontal, metrics.inset).padding(.vertical, 8) }
            ForEach(items) { playlist in
                Button {
                    model.addToPlaylist(source, playlistID: playlist.id)
                    dismiss()
                } label: {
                    HStack(spacing: metrics.gap) {
                        PlaylistThumb(playlist: playlist).frame(width: metrics.rowArtwork, height: metrics.rowArtwork)
                        Text(playlist.name).font(.amRowTitle).lineLimit(1)
                        Spacer()
                        if playlist.songs.contains(where: { $0.id == model.songItem(for: source).id }) {
                            Image(systemName: "checkmark").foregroundStyle(.secondary)
                        }
                    }
                    .padding(.horizontal, metrics.inset).padding(.vertical, 6).contentShape(.rect)
                    .rowSeparator()
                }
                .buttonStyle(RowPressStyle())
            }
        }
    }
}

struct PlaylistThumb: View {
    let playlist: LocalPlaylist

    var body: some View {
        if let url = playlist.songs.first?.imageURL {
            Artwork(url: url, radius: 6)
        } else {
            PlaylistCoverView(style: playlist.cover ?? 0, radius: 6)
        }
    }
}

struct NewPlaylistSheet: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    @Environment(\.metrics) private var metrics
    var source: SongReference?
    var onDone: () -> Void = {}

    @State private var title = ""
    @State private var cover: Int? = 0
    @FocusState private var focused: Bool

    var body: some View {
        let side = min(metrics.width * 0.58, 300)
        VStack(spacing: 20) {
            ScrollView(.horizontal) {
                LazyHStack(spacing: 16) {
                    ForEach(0..<PlaylistCover.palettes.count, id: \.self) { index in
                        PlaylistCoverView(style: index, title: title.isEmpty ? "Playlist Title" : title, radius: 14)
                            .frame(width: side, height: side)
                            .shadow(color: .black.opacity(0.25), radius: 14, y: 8)
                            .scaleEffect(cover == index ? 1 : 0.9)
                            .animation(.snappy(duration: 0.25), value: cover)
                            .id(index)
                    }
                }
                .scrollTargetLayout()
            }
            .contentMargins(.horizontal, (metrics.width - side) / 2, for: .scrollContent)
            .scrollTargetBehavior(.viewAligned)
            .scrollPosition(id: $cover)
            .scrollIndicators(.hidden)
            .frame(height: side + 30)

            HStack(spacing: 6) {
                ForEach(0..<PlaylistCover.palettes.count, id: \.self) { index in
                    Circle().fill(cover == index ? Color.primary : Color.secondary.opacity(0.35)).frame(width: 6, height: 6)
                }
            }
            TextField("Playlist Title", text: $title).font(.title3.weight(.semibold)).multilineTextAlignment(.center)
                .focused($focused).submitLabel(.done).onSubmit(create)
            Spacer(minLength: 0)
        }
        .padding(.top, 24)
        .overlay(alignment: .top) {
            HStack {
                Button("Close", systemImage: "xmark") { dismiss() }.labelStyle(.iconOnly).font(.body.weight(.semibold))
                    .frame(width: 44, height: 44).glassEffect(.regular.interactive(), in: .circle)
                Spacer()
                Text("New Playlist").font(.headline)
                Spacer()
                Button("Create", systemImage: "checkmark", action: create).labelStyle(.iconOnly).font(.body.weight(.bold)).foregroundStyle(.white)
                    .frame(width: 44, height: 44).background(Color.accentColor.opacity(title.trimmingCharacters(in: .whitespaces).isEmpty ? 0.35 : 1), in: .circle)
                    .disabled(title.trimmingCharacters(in: .whitespaces).isEmpty)
            }
            .padding(.horizontal, metrics.inset).padding(.top, 10)
        }
        .padding(.top, 54)
        .presentationDetents([.large])
        .task { focused = true }
    }

    private func create() {
        let name = title.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !name.isEmpty else { return }
        let id = model.createPlaylist(named: name, cover: cover)
        if let source { model.addToPlaylist(source, playlistID: id) }
        dismiss()
        onDone()
    }
}
