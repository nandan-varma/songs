import Foundation
import ModesCore

enum Feedback: String {
    case suggestLess, favorite

    var title: String {
        switch self { case .suggestLess: "Suggest less"; case .favorite: "Favorite" }
    }
}

extension AppModel {
    func feedback(_ f: Feedback) {
        guard let cur = current else { AppLog.info("feedback", "\(f.rawValue) ignored: nothing playing"); return }
        AppLog.info("feedback", "\(f.rawValue) on \(cur.song.title)")
        let removing = f == .favorite && library.isFavorite(cur.id)
        recordUndo(removing ? "Favorite" : f.title, rejected: f == .suggestLess ? cur : nil)
        switch f {
        case .favorite where removing:
            setFavorite(cur, false, heard: false)
            flash("Removed from Favorites"); log("unfavorite", song: cur.id)
        case .favorite:
            setFavorite(cur, true, heard: true)
            flash("Added to Favorites")
        case .suggestLess:

            learn(cur, .rejected)
            log("suggest_less", song: cur.id); flash("You’ll hear less like this")
            advance(.rejected)
            return
        }
        log("feedback_\(f.rawValue)", song: cur.id)
        scheduleSave()
    }

    func toggleSongFavorite(_ source: SongReference) {
        let item = songItem(for: source)
        if item.id == current?.id { feedback(.favorite); return }
        let favorite = !library.isFavorite(item.id)
        recordUndo("Favorite", rejected: nil)
        if setFavorite(item, favorite, heard: false) {
            flash(favorite ? "Added to Favorites" : "Removed from Favorites")
        }
    }

    @discardableResult
    private func setFavorite(_ item: QueueItem, _ favorite: Bool, heard: Bool) -> Bool {
        let changed = FavoriteAction.set(favorite, item: libraryItem(for: item), song: heard ? features(for: item) : nil,
                                         library: &library, profile: &profile, gate: learningGate)
        guard changed else { return false }
        AppLog.info("library", "\(favorite ? "favorite" : "unfavorite") \(item.id)")
        noteTasteChange()
        if current != nil { Task { await rebuildUpNext() } }
        scheduleSave()
        return true
    }

    func reconcileLikes() {
        profile.liked = []
        for item in library.favorites.reversed() { profile.setLiked(item.id, true) }
    }

    func clearRecents() {
        library.clearRecents()
        AppLog.info("library", "cleared recents"); scheduleSave()
    }

    private func recordUndo(_ name: String, rejected: QueueItem?) {
        undoStack.push(UndoEntry(label: "Undo \(name)", snapshot: PersonalizedSnapshot(profile),
                                 favorites: library.favorites, rejected: rejected))
    }

    func undo() {
        guard let entry = undoStack.take() else { return }
        entry.snapshot.restore(into: &profile)
        library.favorites = entry.favorites
        if let rejected = entry.rejected {
            listenerQueue.prepend(rejected)
            upNext = listenerQueue.combining(upNext, excluding: current?.id)
        }
        invalidateRanking()
        Task { await rebuildUpNext() }
        AppLog.info("undo", entry.label)
        flash("Undone"); scheduleSave()
    }

    func resetProfile() {
        profile = PersonalizedProfile()
        for item in library.favorites.reversed() {
            profile.setLiked(item.id, true)
            profile.learn(songItem(for: .library(item)).song, signal: .favorite, gate: LearningGate())
        }
        invalidateRanking()
        log("profile_reset")
        scheduleSave()
        if current != nil { Task { await rebuildUpNext() } }
    }

    func resetEverything() {
        stopPlayback()
        library = LibraryState()
        profile = PersonalizedProfile()
        homeSlate = []
        homeReasons = []
        modelStats = nil
        invalidateRanking()
        try? FileManager.default.removeItem(at: Self.eventsURL)
        saveNow()
    }

    func finishOnboarding(languages: [String]) {
        settings.languages = languages
    }
}
