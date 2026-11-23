import ModesCore
import SwiftUI

/// Contents of the player's "…" menu: feedback, sleep timer and sharing.
struct PlayerMenuItems: View {
    @Environment(AppModel.self) private var model
    let item: QueueItem?
    /// Called for the feedback entries so the player can fire its haptic.
    let onFeedback: () -> Void

    var body: some View {
        Button("Suggest less", systemImage: "hand.thumbsdown") { onFeedback(); model.feedback(.suggestLess) }
        SleepTimerMenu()
        if let item { share(item) }
    }

    /// The song's exact URL is not known, so the link is a JioSaavn search the recipient can open to find it.
    @ViewBuilder private func share(_ item: QueueItem) -> some View {
        let shown = model.display(item), title = shown.title, artist = shown.artist
        if let url = Self.searchURL(title: title, artist: artist) {
            ShareLink(item: url, subject: Text(title), message: Text("\(title) — \(artist)")) {
                Label("Share song", systemImage: "square.and.arrow.up")
            }
        }
    }

    static func searchURL(title: String, artist: String) -> URL? {
        var allowed = CharacterSet.urlPathAllowed
        allowed.remove("/")
        guard let q = "\(title) \(artist)".addingPercentEncoding(withAllowedCharacters: allowed) else { return nil }
        return URL(string: "https://www.jiosaavn.com/search/" + q)
    }
}
