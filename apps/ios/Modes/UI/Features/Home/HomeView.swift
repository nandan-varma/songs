import ModesCore
import SwiftUI

struct HomeView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.metrics) private var metrics
    @Namespace private var zoom
    @State private var moreLike: [SaavnAPI.Hit] = []
    @State private var moreLikeTitle = ""

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVStack(alignment: .leading, spacing: metrics.shelfSpacing) {
                    topPicks
                    recentlyPlayed
                    topSongs
                    if model.settings.labs.moreLike { moreLikeShelf }
                    if model.settings.labs.launchShelves { launchShelves }
                }
                .padding(.top, 4)
                .padding(.bottom, 160)
            }
            .scrollIndicators(.hidden)
            .navigationTitle("Home")
            .toolbar { ToolbarItem(placement: .topBarTrailing) { ProfileButton() } }
            .task(id: model.homeVersion) { await model.loadHomeSlate() }
            .task(id: model.settings.languages) { await model.loadLaunch() }
            .task(id: model.recentItems.first?.id) { await loadMoreLike() }
            .animation(.easeOut(duration: 0.35), value: model.launch != nil)
            .refreshable { await model.refreshHome(); await model.loadLaunch(force: true) }
            .environment(\.zoomNamespace, zoom)
            .musicRoutes()
        }
    }

    @ViewBuilder private var topPicks: some View {
        VStack(alignment: .leading, spacing: metrics.gap) {
            ShelfHeader(title: "Top Picks for You")
            ScrollView(.horizontal) {
                LazyHStack(spacing: metrics.gap) {
                    ZoomLink(route: MusicRoute.favorites) {
                        TallCard(kicker: "Made By You", title: "Favorite Songs",
                                 detail: "All the songs that made you reach for the star.", style: .favorites,
                                 covers: model.favoriteItems.prefix(3).compactMap(\.imageURL))
                    }
                    ZoomLink(route: MusicRoute.forYou) {
                        TallCard(kicker: "Made for You", title: "New Music Mix",
                                 detail: forYouDetail, style: .mix, covers: model.homeSlate.prefix(3).compactMap { model.artURL($0) })
                    }
                    ForEach(mixArtists, id: \.self) { artist in
                        ZoomLink(route: MusicRoute.recents) {
                            TallCard(kicker: "Made for You", title: "\(artist) Mix", detail: "Songs like \(artist) and more.",
                                     style: .artist(artist),
                                     covers: model.recentItems.filter { $0.artist.localizedCaseInsensitiveContains(artist) }.prefix(3).compactMap(\.imageURL))
                        }
                    }
                }
                .buttonStyle(CardPressStyle())
                .scrollTargetLayout()
            }
            .contentMargins(.horizontal, metrics.inset, for: .scrollContent)
            .scrollTargetBehavior(.viewAligned)
            .scrollIndicators(.hidden)
        }
    }

    private var forYouDetail: String {
        let names = model.homeSlate.prefix(6).map { model.display($0).compactArtist.split(separator: ",").first.map(String.init) ?? "" }
        let unique = names.reduce(into: [String]()) { if !$1.isEmpty, !$0.contains($1) { $0.append($1) } }
        return unique.isEmpty ? "Fresh songs picked from what you play." : unique.prefix(4).joined(separator: ", ") + ", and more"
    }

    private var mixArtists: [String] {
        let names = model.recentItems.prefix(30).map { $0.artist.split(separator: ",").first.map { String($0).trimmingCharacters(in: .whitespaces) } ?? "" }
        let counts = names.filter { !$0.isEmpty }.reduce(into: [String: Int]()) { $0[$1, default: 0] += 1 }
        return counts.filter { $0.value >= 2 }.sorted { $0.value > $1.value }.prefix(2).map(\.key)
    }

    @ViewBuilder private var recentlyPlayed: some View {
        let recents = Array(model.recentItems.prefix(15))
        if !recents.isEmpty {
            let context = recents.map { SongReference.library($0) }
            VStack(alignment: .leading, spacing: metrics.gap) {
                NavigationLink(value: MusicRoute.recents) { ShelfHeader(title: "Recently Played", showsChevron: true) }
                    .buttonStyle(.plain)
                ScrollView(.horizontal) {
                    LazyHStack(alignment: .top, spacing: metrics.gap) {
                        ForEach(recents) { item in
                            Button { model.playSong(.library(item), in: context) } label: {
                                TileCard(url: item.imageURL, title: item.title, subtitle: item.artist)
                            }
                            .buttonStyle(CardPressStyle())
                        }
                    }
                    .scrollTargetLayout()
                }
                .contentMargins(.horizontal, metrics.inset, for: .scrollContent)
                .scrollTargetBehavior(.viewAligned)
                .scrollIndicators(.hidden)
            }
        }
    }

    @ViewBuilder private var topSongs: some View {
        let top = model.listening.topSongs(10).filter { $0.entry.plays >= 2 }
        if top.count >= 3 {
            let items = top.compactMap { entry in model.favoriteItems.first { $0.id == entry.id } ?? model.recentItems.first { $0.id == entry.id } }
            let context = items.map { SongReference.library($0) }
            VStack(alignment: .leading, spacing: metrics.gap) {
                ShelfHeader(title: "Your Top Songs")
                ScrollView(.horizontal) {
                    LazyHStack(alignment: .top, spacing: metrics.gap) {
                        ForEach(items) { item in
                            Button { model.playSong(.library(item), in: context) } label: {
                                TileCard(url: item.imageURL, title: item.title, subtitle: "\(model.listening.plays(of: item.id)) plays")
                            }
                            .buttonStyle(CardPressStyle())
                        }
                    }
                    .scrollTargetLayout()
                }
                .contentMargins(.horizontal, metrics.inset, for: .scrollContent)
                .scrollTargetBehavior(.viewAligned)
                .scrollIndicators(.hidden)
            }
        }
    }

    @ViewBuilder private var moreLikeShelf: some View {
        if !moreLike.isEmpty {
            let context = moreLike.map { SongReference.hit($0) }
            VStack(alignment: .leading, spacing: metrics.gap) {
                VStack(alignment: .leading, spacing: 0) {
                    Text("More Like").font(.footnote).foregroundStyle(.secondary)
                    Text(moreLikeTitle).font(.amSection).lineLimit(2)
                }
                .padding(.horizontal, metrics.inset)
                ScrollView(.horizontal) {
                    LazyHStack(alignment: .top, spacing: metrics.gap) {
                        ForEach(moreLike) { hit in
                            let display = model.display(title: hit.song.title, artist: hit.song.artist, album: hit.song.album)
                            Button { model.playSong(.hit(hit), in: context) } label: {
                                TileCard(url: hit.song.image, title: display.title, subtitle: display.compactArtist)
                            }
                            .buttonStyle(CardPressStyle())
                        }
                    }
                    .scrollTargetLayout()
                }
                .contentMargins(.horizontal, metrics.inset, for: .scrollContent)
                .scrollTargetBehavior(.viewAligned)
                .scrollIndicators(.hidden)
            }
        }
    }

    private func loadMoreLike() async {
        guard model.settings.labs.moreLike, let seed = model.recentItems.first else { moreLike = []; return }
        let hits = (try? await SaavnAPI.suggestions(songID: seed.id, limit: 15, delivery: model.delivery)) ?? []
        guard !Task.isCancelled else { return }
        moreLike = hits
        moreLikeTitle = seed.title
    }

    @ViewBuilder private var launchShelves: some View {
        if let launch = model.launch {
            ForEach(launch.shelves.filter(Self.homeKeys)) { shelf in
                Shelf(title: shelf.title) {
                    ForEach(shelf.items) { TileLink(tile: $0) }
                }
            }
        } else if model.launchFailed {
            LoadFailedView { Task { await model.loadLaunch(force: true) } }
        } else {
            ShelfSkeleton(); ShelfSkeleton()
        }
    }

    static func homeKeys(_ shelf: SaavnAPI.Shelf) -> Bool {
        !["charts", "new_albums", "radio", "artist_recos", "city_mod"].contains(shelf.key) && !shelf.title.localizedCaseInsensitiveContains("podcast")
    }
}
