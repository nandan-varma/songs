import SwiftUI

enum SongSwipeAction: String, CaseIterable, Identifiable {
    case favorite, playNext, playNow, none
    var id: Self { self }
    var title: String {
        switch self { case .favorite: "Favorite"; case .playNext: "Play next"; case .playNow: "Play now"; case .none: "None" }
    }
    var icon: String {
        switch self { case .favorite: "heart"; case .playNext: "text.line.first.and.arrowtriangle.forward"; case .playNow: "play.fill"; case .none: "minus" }
    }
    var tint: Color {
        switch self { case .favorite: .pink; case .playNext: .orange; case .playNow: .blue; case .none: .gray }
    }
}

enum SongSwipePreference {
    static let enabled = "songSwipes.enabled"
    static let leading = "songSwipes.leading"
    static let trailing = "songSwipes.trailing"
    static let fullSwipe = "songSwipes.fullSwipe"
}
