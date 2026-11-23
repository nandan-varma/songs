import ModesCore
import SwiftUI

/// Language-aware hot songs, shown before the listener types a query.
struct SearchBrowseView: View {
    @Environment(AppModel.self) private var model
    @State private var sections: [HotSection] = []
    @State private var charts: [SaavnAPI.Chart] = []
    @State private var loading = true
    @State private var failed = false
    @State private var retry = 0

    struct HotSection: Identifiable {
        let language: String
        let hits: [SaavnAPI.Hit]
        var id: String { language }
    }

    var body: some View {
        Group {
            if loading {
                ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if sections.isEmpty {
                ContentUnavailableView {
                    Label(failed ? "Couldn’t load songs" : "No songs yet",
                          systemImage: failed ? "wifi.exclamationmark" : "music.note")
                } actions: {
                    if failed { Button("Retry") { retry += 1 }.buttonStyle(.bordered) }
                }
            } else {
                List {
                    if !charts.isEmpty {
                        Section("Charts") {
                            ForEach(charts) { chart in
                                NavigationLink(value: MusicRoute.chart(chart.id)) {
                                    CollectionRow(imageURL: chart.image, title: chart.name,
                                                  subtitle: chart.songCount.map { "\($0) songs" } ?? "")
                                }
                            }
                        }
                    }
                    ForEach(sections) { section in
                        let context = section.hits.map { SongReference.hit($0) }
                        Section {
                            ForEach(section.hits, id: \.song.id) { hit in
                                SongListRow(source: .hit(hit), context: context)
                            }
                        } header: {
                            SectionHeading(title: "Hot in \(section.language.capitalized)")
                        }
                    }
                }
                .musicListStyle()
            }
        }
        .background(Color(.systemBackground))
        .musicRoutes()
        .task(id: LoadKey(languages: model.settings.languages, baseURL: model.settings.baseURL,
                          highQuality: model.settings.highQuality, retry: retry)) {
            await load()
        }
        .task(id: "charts") {
            charts = (try? await SaavnAPI.charts(baseURL: model.settings.baseURL,
                                                 highQuality: model.settings.highQuality)) ?? []
            ImagePipeline.shared.prefetch(charts.compactMap(\.image))
        }
    }

    private func load() async {
        loading = true
        failed = false
        let languages = model.settings.languages
        guard !languages.isEmpty else {
            sections = []
            loading = false
            return
        }
        var loaded: [HotSection] = []
        for language in languages {
            do {
                let hits = try await SaavnAPI.trending(language: language, baseURL: model.settings.baseURL,
                                                       highQuality: model.settings.highQuality)
                guard !Task.isCancelled else { return }
                if !hits.isEmpty { loaded.append(HotSection(language: language, hits: Array(hits.prefix(20)))) }
            } catch {
                guard !Task.isCancelled else { return }
            }
        }
        guard !Task.isCancelled else { return }
        sections = loaded
        failed = loaded.isEmpty
        loading = false
        ImagePipeline.shared.prefetch(loaded.flatMap { $0.hits.compactMap(\.song.image) })
    }

    private struct LoadKey: Equatable {
        let languages: [String]
        let baseURL: String
        let highQuality: Bool
        let retry: Int
    }
}
