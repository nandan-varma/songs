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
                            LoadFailedView { Task { await model.refreshHome() } }
                        } else if model.homeReady {
                            ContentUnavailableView("Nothing to play yet", systemImage: "music.note",
                                                   description: Text("Songs you can play will appear here."))
                        } else {
                            SkeletonRows(count: 10)
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
            .refreshable { await model.refreshHome() }
            .musicRoutes()
        }
    }
}
