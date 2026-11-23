import SwiftUI

struct LyricsView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    @State private var text: String?
    @State private var failed = false
    @State private var attempt = 0

    var body: some View {
        NavigationStack {
            Group {
                if let text {
                    ScrollView { Text(text).font(.title3.weight(.semibold)).padding(24).frame(maxWidth: .infinity, alignment: .leading) }
                } else if failed {
                    LoadFailedView { attempt += 1 }
                } else {
                    List { SkeletonRows(count: 6) }.musicListStyle()
                }
            }
            .navigationTitle("Lyrics").navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() }.fontWeight(.semibold) } }
            .task(id: "\(model.current?.id ?? "")|\(attempt)") {
                guard let id = model.current?.id else { return }
                failed = false
                text = await model.lyrics(for: id)
                failed = text == nil
            }
        }
    }
}
