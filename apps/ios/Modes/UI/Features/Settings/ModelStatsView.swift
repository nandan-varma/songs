import ModesCore
import SwiftUI

struct ModelStatsView: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        Form {
            if let stats = model.modelStats {
                Section {
                    LabeledContent("Signals learned", value: "\(stats.observations)")
                    LabeledContent("Liked songs", value: "\(stats.liked)")
                    LabeledContent("Hidden songs", value: "\(stats.banned)")
                    LabeledContent("Recently heard", value: "\(stats.recent)")
                    LabeledContent("Personalization", value: model.settings.personalizationPaused ? "Paused" : "On")
                } header: {
                    Text("Profile")
                } footer: {
                    Text("A finish, skip, favorite or “Suggest less” is one signal. Everything stays on this iPhone.")
                }

                Section {
                    LabeledContent("Feature space", value: "\(stats.dimension) buckets")
                    LabeledContent("Active features", value: "\(stats.activeFeatures)")
                    LabeledContent("Up next", value: "\(model.upNext.count)")
                    LabeledContent("Session history", value: "\(model.history.count)")
                } header: {
                    Text("Model")
                } footer: {
                    Text("Sparse hashed metadata. No song index and no per-song server artefact.")
                }

                if !model.favoriteItems.isEmpty {
                    Section("Liked songs") {
                        ForEach(model.favoriteItems.prefix(10)) { item in
                            VStack(alignment: .leading, spacing: 2) {
                                Text(item.title).font(.subheadline)
                                Text(item.artist).font(.caption).foregroundStyle(.secondary)
                            }
                        }
                    }
                }

                let hidden = model.profile.banned.compactMap { model.displayTitle(forSongID: $0) }
                if !hidden.isEmpty {
                    Section("Hidden songs") {
                        ForEach(Array(hidden.prefix(10).enumerated()), id: \.offset) { _, title in
                            Text(title).font(.subheadline)
                        }
                    }
                }

                if !model.homeSlate.isEmpty {
                    Section {
                        ForEach(Array(model.homeSlate.prefix(5).enumerated()), id: \.element.id) { position, item in
                            VStack(alignment: .leading, spacing: 3) {
                                HStack(spacing: 8) {
                                    Text(position + 1, format: .number)
                                        .font(.caption.monospacedDigit()).foregroundStyle(.tertiary)
                                        .frame(minWidth: 14, alignment: .leading)
                                    Text(model.display(item).title).font(.subheadline)
                                }
                                if model.homeReasons.indices.contains(position) {
                                    Text(model.homeReasons[position])
                                        .font(.caption).foregroundStyle(.secondary)
                                        .padding(.leading, 22)
                                }
                            }
                        }
                    } header: {
                        Text("For You preview")
                    } footer: {
                        Text("The current top five, with the model's own explanation.")
                    }
                }
            } else if model.modelStatsLoading {
                Section {
                    HStack(spacing: 10) { ProgressView(); Text("Measuring…").foregroundStyle(.secondary) }
                        .frame(maxWidth: .infinity, minHeight: 80)
                }
            } else {
                ContentUnavailableView("No model data", systemImage: "chart.bar.xaxis",
                                       description: Text("Play or favorite a song, then come back."))
                    .listRowBackground(Color.clear)
            }
        }
        .navigationTitle("Model")
        .navigationBarTitleDisplayMode(.inline)
        .task(id: model.homeVersion) { await model.loadStats() }
        .refreshable { await model.loadStats() }
    }
}
