import AppIntents
import Foundation

enum ModesIntentError: Error, CustomLocalizedStringResourceConvertible {
    case notSetUp

    var localizedStringResource: LocalizedStringResource {
        switch self { case .notSetUp: "Open the app once to set it up." }
    }
}

/// Transport intents for the Action Button and Shortcuts. All run on the main actor because they touch the model.
struct TogglePlaybackIntent: AudioPlaybackIntent {
    static let title: LocalizedStringResource = "Play or Pause"
    static let description = IntentDescription("Toggles playback.", categoryName: "Playback")

    @MainActor
    func perform() async throws -> some IntentResult {
        let model = try await AppRuntime.ensureModel()
        guard model.onboarded else { throw ModesIntentError.notSetUp }
        AppLog.info("intents", "TogglePlaybackIntent wasPlaying=\(model.isPlaying)")
        model.togglePlay()
        return .result()
    }
}

struct NextSongIntent: AudioPlaybackIntent {
    static let title: LocalizedStringResource = "Next Song"
    static let description = IntentDescription("Skips to the next song.", categoryName: "Playback")

    @MainActor
    func perform() async throws -> some IntentResult {
        let model = try await AppRuntime.ensureModel()
        guard model.onboarded else { throw ModesIntentError.notSetUp }
        AppLog.info("intents", "NextSongIntent")
        model.skip()
        return .result()
    }
}

struct PreviousSongIntent: AudioPlaybackIntent {
    static let title: LocalizedStringResource = "Previous Song"
    static let description = IntentDescription("Goes back to the previous song.", categoryName: "Playback")

    @MainActor
    func perform() async throws -> some IntentResult {
        let model = try await AppRuntime.ensureModel()
        guard model.onboarded else { throw ModesIntentError.notSetUp }
        AppLog.info("intents", "PreviousSongIntent")
        model.previous()
        return .result()
    }
}
