import SwiftUI

struct ToastView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @ScaledMetric(relativeTo: .footnote) private var minTarget = 44
    @State private var undoTick = 0

    let text: String?

    var allowsUndo = true

    private struct Phase: Equatable { let text: String?; let undoable: Bool }

    var body: some View {
        let undoable = allowsUndo && model.undoAvailable
        Group {
            if text != nil || undoable { capsule(undoable: undoable) }
        }
        .animation(reduceMotion ? .easeInOut(duration: 0.15) : .spring(duration: 0.4), value: Phase(text: text, undoable: undoable))
        .sensoryFeedback(.impact(weight: .medium), trigger: undoTick)
    }

    private func capsule(undoable: Bool) -> some View {
        HStack(spacing: 0) {
            if let text {
                Text(text).font(.toastMessage).lineLimit(2).fixedSize(horizontal: false, vertical: true).multilineTextAlignment(.leading)
                    .padding(.leading, 16).padding(.trailing, undoable ? 8 : 16).padding(.vertical, 11)
            }
            if undoable { undoButton(showsFullLabel: text == nil) }
        }
        .frame(minHeight: minTarget)
        .padding(.horizontal, 4)
        .glassEffect(.regular, in: .capsule)
        .padding(.horizontal, 20)
        .transition(reduceMotion ? .opacity : .move(edge: .bottom).combined(with: .opacity))
        .accessibilityElement(children: .contain)
    }

    private func undoButton(showsFullLabel: Bool) -> some View {
        Button {
            undoTick += 1
            model.undo()
        } label: {
            Text(showsFullLabel ? (model.undoLabel ?? "Undo") : "Undo")
                .font(.toastMessage).foregroundStyle(Color.brand)
                .padding(.horizontal, 16).frame(minHeight: minTarget).contentShape(.rect)
        }
        .buttonStyle(.plain)
        .accessibilityLabel(model.undoLabel ?? "Undo")
    }
}
