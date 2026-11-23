import SwiftUI

private struct HapticModifier<Trigger: Equatable>: ViewModifier {
    @Environment(AppModel.self) private var model
    let feedback: SensoryFeedback
    let trigger: Trigger

    func body(content: Content) -> some View {
        content.sensoryFeedback(trigger: trigger) { _, _ in model.settings.haptics ? feedback : nil }
    }
}

extension View {
    func haptic<Trigger: Equatable>(_ feedback: SensoryFeedback, trigger: Trigger) -> some View {
        modifier(HapticModifier(feedback: feedback, trigger: trigger))
    }
}
