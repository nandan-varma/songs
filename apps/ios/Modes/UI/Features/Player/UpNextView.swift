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
                        SongListRow(source: .queued(item), context: context, detail: model.settings.showWhy ? item.why : nil)
                    }
                }
            }
            .musicListStyle()
            .navigationTitle("Up next").navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() }.fontWeight(.semibold) } }
        }
    }
}
