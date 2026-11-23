import AppIntents

struct ModesShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: TogglePlaybackIntent(),
            phrases: [
                "Pause \(.applicationName)",
                "Resume \(.applicationName)",
                "Pause music in \(.applicationName)",
            ],
            shortTitle: "Play or Pause",
            systemImageName: "playpause.fill"
        )
        AppShortcut(
            intent: NextSongIntent(),
            phrases: ["Skip in \(.applicationName)", "Next song in \(.applicationName)"],
            shortTitle: "Next Song",
            systemImageName: "forward.fill"
        )
        AppShortcut(
            intent: PreviousSongIntent(),
            phrases: ["Previous song in \(.applicationName)"],
            shortTitle: "Previous Song",
            systemImageName: "backward.fill"
        )
    }
}
