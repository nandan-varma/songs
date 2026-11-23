import ModesCore
import SwiftUI

struct OnboardingView: View {
    @Environment(AppModel.self) private var model
    @State private var picked = ["hindi", "english"]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                HStack(spacing: 9) {
                    LogoMark(size: 28)
                    Text("Modes").font(.headline)
                }.accessibilityElement(children: .combine)
                VStack(alignment: .leading, spacing: 10) {
                    Text("What do you listen to?").font(.largeTitle.bold())
                    Text("Choose your languages.")
                        .font(.body).foregroundStyle(.secondary)
                }
                LanguageChips(selected: $picked)
            }.padding(24)
        }
        .background(Color(.systemBackground))
        .safeAreaInset(edge: .bottom, spacing: 0) {
            Button { model.finishOnboarding(languages: picked) } label: {
                HStack { Text("Start listening"); Spacer(); Image(systemName: "arrow.right") }
                    .font(.headline).padding(.horizontal, 8).frame(maxWidth: .infinity, minHeight: 48)
            }
            .buttonStyle(.glassProminent).controlSize(.large).disabled(picked.isEmpty)
            .padding(24).background(Color(.systemBackground))
        }
        .haptic(.selection, trigger: picked)
    }
}
