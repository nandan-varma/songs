import ModesCore
import SwiftUI

struct SleepTimerMenu: View {
    @Environment(AppModel.self) private var model

    private let choices: [(title: LocalizedStringKey, timer: SleepTimer)] = [
        ("Off", .off), ("15 minutes", .minutes(15)), ("30 minutes", .minutes(30)),
        ("45 minutes", .minutes(45)), ("60 minutes", .minutes(60)), ("End of song", .endOfSong),
    ]

    var body: some View {
        Menu("Sleep timer", systemImage: "moon.zzz") {
            ForEach(choices.indices, id: \.self) { i in
                let choice = choices[i]
                Button { model.setSleepTimer(choice.timer) } label: {
                    if model.sleepTimer == choice.timer { Label(choice.title, systemImage: "checkmark") } else { Text(choice.title) }
                }
            }
        }
    }
}

struct SleepTimerBadge: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        switch model.sleepTimer {
        case .off:
            EmptyView()
        case .endOfSong:
            badge("End of song", spoken: "Sleep timer, stops after this song")
        case .minutes:
            TimelineView(.periodic(from: .now, by: 30)) { context in
                let left = max(1, Int(((model.sleepDeadline?.timeIntervalSince(context.date) ?? 0) / 60).rounded(.up)))
                badge("\(left) min", spoken: "Sleep timer, \(left) minutes left")
            }
        }
    }

    private func badge(_ text: LocalizedStringKey, spoken: LocalizedStringKey) -> some View {
        Label(text, systemImage: "moon.zzz.fill")
            .font(.playerMeta).monospacedDigit().foregroundStyle(.playerSecondary).lineLimit(1)
            .accessibilityElement(children: .ignore).accessibilityLabel(spoken)
    }
}
