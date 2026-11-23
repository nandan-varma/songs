import ModesCore
import SwiftUI

struct HomeView: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        NavigationStack {
            List {
                let slate = model.homeSlate
                let context = slate.map { SongReference.queued($0) }
                if slate.isEmpty {
                    Group {
                        if model.homeFailed {
                            ContentUnavailableView {
                                Label("Can’t reach the music server", systemImage: "wifi.exclamationmark")
                            } description: {
                                Text("Check your connection and try again.")
                            } actions: {
                                Button("Try again") { Task { await model.refreshHome() } }.buttonStyle(.bordered)
                            }
                        } else if model.homeReady {
                            ContentUnavailableView("Nothing to play yet", systemImage: "music.note",
                                                   description: Text("Songs you can play will appear here."))
                        } else {
                            ProgressView("Finding something for you…").frame(maxWidth: .infinity, minHeight: 160)
                        }
                    }
                    .listRowBackground(Color.clear)
                } else {
                    Section {
                        ForEach(Array(slate.enumerated()), id: \.element.id) { number, item in
                            SongListRow(source: .queued(item), context: context, number: number + 1)
                        }
                    } header: {
                        SectionHeading(title: "For You", subtitle: model.settings.languages.map(\.capitalized).joined(separator: " · "))
                            .textCase(nil).padding(.vertical, 6)
                    }
                }
            }
            .musicListStyle()
            .navigationTitle("Listen now")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) { SettingsButton() }
            }
            .task(id: model.homeVersion) { await model.loadHomeSlate() }
            .task { await model.loadCharts() }
            .refreshable { await model.refreshHome() }
            .musicRoutes()
        }
    }
}
