import Charts
import ModesCore
import SwiftUI

struct ListeningStatsView: View {
    @Environment(AppModel.self) private var model
    @State private var confirmReset = false

    var body: some View {
        let stats = model.listening
        Form {
            if stats.plays == 0 {
                ContentUnavailableView("No listening yet", systemImage: "chart.bar",
                                       description: Text("Play a few songs and your stats appear here."))
            } else {
                Section {
                    LabeledContent("Time listened", value: SettingsView.duration(stats.totalSeconds))
                    LabeledContent("Last 7 days", value: SettingsView.duration(stats.seconds(inLast: 7)))
                    LabeledContent("Day streak", value: "\(stats.streak())")
                    LabeledContent("Songs played", value: "\(stats.plays)")
                }
                Section {
                    LabeledContent("Finished", value: stats.completionRate.formatted(.percent.precision(.fractionLength(0))))
                    LabeledContent("Skipped", value: stats.skipRate.formatted(.percent.precision(.fractionLength(0))))
                    LabeledContent("Average listened", value: stats.averageFractionHeard.formatted(.percent.precision(.fractionLength(0))))
                    LabeledContent("Replayed", value: "\(stats.replays)")
                } header: { Text("How you listen") } footer: {
                    Text("These shape your recommendations: finishing and replaying raise similar songs, early skips lower them.")
                }
                artists(stats)
                songs(stats)
                languages(stats)
                clock(stats)
            }
            Section {
                Button("Reset listening history", role: .destructive) { confirmReset = true }
            } footer: { Text("Stats stay on this iPhone. Resetting them does not change recommendations.") }
        }
        .navigationTitle("Your Listening").navigationBarTitleDisplayMode(.inline)
        .confirmationDialog("Reset listening history?", isPresented: $confirmReset, titleVisibility: .visible) {
            Button("Reset", role: .destructive) { model.resetListening() }
        }
    }

    @ViewBuilder private func artists(_ stats: ListeningStats) -> some View {
        let top = stats.topArtists(5)
        if !top.isEmpty {
            Section("Top artists") {
                ForEach(Array(top.enumerated()), id: \.offset) { index, entry in
                    HStack(spacing: 12) {
                        Text("\(index + 1)").font(.body.monospacedDigit()).foregroundStyle(.secondary).frame(width: 20)
                        Artwork(url: entry.imageURL, radius: 22).frame(width: 44, height: 44)
                        VStack(alignment: .leading) {
                            Text(entry.name).lineLimit(1)
                            Text("\(SettingsView.duration(entry.secondsHeard)) · \(entry.plays) plays").font(.subheadline).foregroundStyle(.secondary)
                        }
                    }
                }
            }
        }
    }

    @ViewBuilder private func songs(_ stats: ListeningStats) -> some View {
        let top = stats.topSongs(5)
        if !top.isEmpty {
            Section("Top songs") {
                ForEach(top, id: \.id) { item in
                    HStack(spacing: 12) {
                        Artwork(url: item.entry.imageURL, radius: 6).frame(width: 44, height: 44)
                        VStack(alignment: .leading) {
                            Text(item.entry.name).lineLimit(1)
                            Text(item.entry.detail).font(.subheadline).foregroundStyle(.secondary).lineLimit(1)
                        }
                        Spacer()
                        Text("\(item.entry.plays)×").foregroundStyle(.secondary).monospacedDigit()
                    }
                }
            }
        }
    }

    @ViewBuilder private func languages(_ stats: ListeningStats) -> some View {
        let top = stats.topLanguages()
        if top.count > 1 {
            Section("Languages") {
                Chart(top, id: \.name) { entry in
                    BarMark(x: .value("Time", entry.secondsHeard / 3600), y: .value("Language", entry.name))
                        .foregroundStyle(Color.accentColor.gradient)
                }
                .chartXAxisLabel("hours").frame(height: CGFloat(top.count) * 34 + 24)
            }
        }
    }

    private func clock(_ stats: ListeningStats) -> some View {
        Section {
            Chart(Array(stats.hours.enumerated()), id: \.offset) { hour, seconds in
                BarMark(x: .value("Hour", hour), y: .value("Minutes", seconds / 60))
                    .foregroundStyle(Color.accentColor.gradient)
            }
            .chartXScale(domain: 0...23)
            .chartXAxis { AxisMarks(values: [0, 6, 12, 18, 23]) { AxisValueLabel() } }
            .frame(height: 120)
        } header: { Text("When you listen") } footer: {
            if let hour = stats.favouriteHour {
                Text("Most of your listening is around \(Self.hourLabel(hour)).")
            }
        }
    }

    private static func hourLabel(_ hour: Int) -> String {
        let date = Calendar.current.date(bySettingHour: hour, minute: 0, second: 0, of: Date()) ?? Date()
        return date.formatted(date: .omitted, time: .shortened)
    }
}
