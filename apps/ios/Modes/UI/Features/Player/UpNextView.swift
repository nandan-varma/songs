import ModesCore
import SwiftUI

struct UpNextView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            List {
                let queue = model.upNext
                let context = queue.map { SongReference.queued($0) }
                Section {
                    ForEach(queue) { item in
                        SongListRow(source: .queued(item), context: context, detail: item.why)
                    }
                }
            }
            .musicListStyle()
            .navigationTitle("Up next").navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() }.fontWeight(.semibold) } }
            .task(id: model.upNext.map(\.id)) { model.ensureArtwork(for: model.upNext.map(\.index).filter { $0 >= 0 }) }
        }
    }
}
