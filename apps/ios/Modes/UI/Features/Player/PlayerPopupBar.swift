import LNPopupUI
import ModesCore
import SwiftUI

struct PlayerPopupBar: ViewModifier {
    @Environment(AppModel.self) private var model

    @Environment(\.popupBarPlacement) private var placement

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
