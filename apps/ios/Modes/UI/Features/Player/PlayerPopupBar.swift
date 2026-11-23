import LNPopupUI
import ModesCore
import SwiftUI

/// The mini player pill: title and artist, play/pause (and next, in the full-width pill) on the trailing side, and
/// horizontal paging between the previous, current and next songs, as in Apple Music.
///
/// How LNPopupUI turns this into UIKit, and why it matters here: the toolbar content of the *selected* item is hosted in a
/// hidden `NavigationView` and converted to `UIBarButtonItem`s, and the hosting adapter publishes those items to the bar
/// after SwiftUI has laid them out. Anything that changes the toolbar's structure or size between evaluations (a label whose
/// title and symbol both flip, a group that is rebuilt, a button with no frame of its own) makes the adapter publish a new
/// item list that the bar may lay out before it has a size, which is how the button went missing or sat misaligned until a
/// swipe forced another layout. So the button structure here is identical on every evaluation: one `ToolbarItem`, one
/// `PopupBarButtons` view, fixed control sizes, and only the symbol name changes.
struct PlayerPopupBar: ViewModifier {
    @Environment(AppModel.self) private var model
    /// Resolves in the popup content, like in LNPopupUI's own Apple Music example; `.inline` is the short pill.
    @Environment(\.popupBarPlacement) private var placement
    /// The last song that was current, so a moment with no current song (a failed load, a hand-off) keeps the previous entry
    /// instead of swapping in a placeholder with a different id.
    @State private var lastCurrent: QueueItem?

    private struct Entry: Identifiable {
        let id: String
        let title: String
        let artist: String
        let image: UIImage
    }

    func body(content: Content) -> some View {
        let cur = model.current ?? lastCurrent
        let prev = model.history.last.flatMap { $0.id == cur?.id ? nil : $0 }
        let next = model.upNext.first.flatMap { $0.id == cur?.id || $0.id == prev?.id ? nil : $0 }
        let entries = Self.entries([prev, cur, next], model: model, current: cur)
        let selectedID = cur?.id ?? entries[0].id
        let selection = Binding<String>(
            get: { selectedID },
            set: { id in
                // LNPopupUI also writes the selection to reconcile a list that does not contain it; only real paging may skip.
                guard id != selectedID else { return }
                if id == next?.id { model.skip() } else if id == prev?.id { model.previous() }
            })
        let isPlaying = model.isPlaying
        let showsNext = placement != .inline
        return content
            .onChange(of: model.current, initial: true) { _, new in if let new { lastCurrent = new } }
            .popupItems(selection: selection) {
                for e in entries {
                    PopupItem(id: e.id, verbatimTitle: e.title, verbatimSubtitle: e.artist, image: Image(uiImage: e.image), trailingButtons: {
                        ToolbarItem(placement: .popupBar) {
                            PopupBarButtons(isPlaying: isPlaying, showsNext: showsNext,
                                            togglePlay: { [model] in model.togglePlay() }, next: { [model] in model.skip() })
                        }
                    })
                }
            }
    }

    /// One entry per distinct song, in order. Never empty, and never a placeholder once a song has played.
    private static func entries(_ songs: [QueueItem?], model: AppModel, current: QueueItem?) -> [Entry] {
        var result: [Entry] = []
        for song in songs {
            guard let song, !result.contains(where: { $0.id == song.id }) else { continue }
            let art = song.id == current?.id ? (model.currentArt ?? model.cachedArt(for: song)) : model.cachedArt(for: song)
            let d = model.display(song)
            result.append(Entry(id: song.id, title: d.title, artist: d.artist, image: art ?? PlayerView.placeholder))
        }
        if result.isEmpty { result = [Entry(id: "none", title: "Finding something for you…", artist: "", image: PlayerView.placeholder)] }
        return result
    }
}

/// The pill's buttons. The same view tree every time; the symbol is the only thing that changes. Each button has a fixed
/// height and an intrinsic width, so UIKit anchors the controls at the trailing edge without reserving extra text space.
private struct PopupBarButtons: View {
    let isPlaying: Bool
    let showsNext: Bool
    let togglePlay: () -> Void
    let next: () -> Void

    var body: some View {
        HStack(spacing: 0) {
            Button(action: togglePlay) {
                Image(systemName: isPlaying ? "pause.fill" : "play.fill")
                    .font(.system(size: showsNext ? 20 : 17, weight: .semibold))
                    .frame(width: showsNext ? 44 : 36, height: 44)
                    .contentShape(.rect)
            }
            .accessibilityLabel(isPlaying ? "Pause" : "Play")

            if showsNext {
                Button(action: next) {
                    Image(systemName: "forward.fill")
                        .font(.system(size: showsNext ? 20 : 17, weight: .semibold))
                        .frame(width: showsNext ? 44 : 36, height: 44)
                        .contentShape(.rect)
                }
                .accessibilityLabel("Next")
            }
        }
        .buttonStyle(.plain)
        .fixedSize(horizontal: true, vertical: true)
        .contentTransition(.symbolEffect(.replace))
        .animation(.spring(duration: 0.1), value: showsNext)
    }
}
