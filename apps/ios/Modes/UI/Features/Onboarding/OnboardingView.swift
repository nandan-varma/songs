import ModesCore
import SwiftUI

struct OnboardingView: View {
    @Environment(AppModel.self) private var model
    @State private var picked: Set<String> = ["hindi", "english"]
    private let languages = ["hindi", "english", "punjabi", "tamil", "telugu", "bengali", "marathi", "kannada", "malayalam", "gujarati", "bhojpuri", "haryanvi"]

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
                FlowLayout(spacing: 10) {
                    ForEach(languages, id: \.self) { language in
                        let on = picked.contains(language)
                        Button { if on { picked.remove(language) } else { picked.insert(language) } } label: {
                            HStack(spacing: 8) {
                                Text(language.capitalized)
                                if on { Image(systemName: "checkmark").font(.caption.weight(.bold)) }
                            }
                            .font(.chip).padding(.horizontal, 16).frame(minHeight: 48)
                            .foregroundStyle(on ? Color(.systemBackground) : Color.primary)
                            .background(on ? Color.primary : Color(.secondarySystemGroupedBackground), in: .capsule)
                        }.buttonStyle(.plain).accessibilityAddTraits(on ? .isSelected : [])
                    }
                }
            }.padding(24)
        }
        .background(Color(.systemBackground))
        .safeAreaInset(edge: .bottom, spacing: 0) {
            Button { model.finishOnboarding(languages: languages.filter(picked.contains)) } label: {
                HStack { Text("Start listening"); Spacer(); Image(systemName: "arrow.right") }
                    .font(.headline).padding(.horizontal, 8).frame(maxWidth: .infinity, minHeight: 48)
            }
            .buttonStyle(.glassProminent).controlSize(.large).disabled(picked.isEmpty)
            .padding(24).background(Color(.systemBackground))
        }
        .sensoryFeedback(.selection, trigger: picked)
    }
}
