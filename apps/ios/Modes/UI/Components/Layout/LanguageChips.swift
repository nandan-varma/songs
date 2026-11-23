import SwiftUI

struct LanguageChips: View {
    static let all = ["hindi", "english", "punjabi", "tamil", "telugu", "bengali", "marathi", "kannada",
                      "malayalam", "gujarati", "bhojpuri", "haryanvi"]

    @Binding var selected: [String]

    var body: some View {
        FlowLayout(spacing: 8) {
            ForEach(Self.all, id: \.self) { language in
                let on = selected.contains(language)
                Button {
                    if on { selected.removeAll { $0 == language } } else { selected.append(language) }
                } label: {
                    HStack(spacing: 6) {
                        Text(language.capitalized)
                        if on { Image(systemName: "checkmark").font(.caption.weight(.bold)) }
                    }
                    .font(.subheadline.weight(.medium)).padding(.horizontal, 14).frame(minHeight: 44)
                    .foregroundStyle(on ? Color(.systemBackground) : Color.primary)
                    .background(on ? Color.primary : Color(.tertiarySystemFill), in: .capsule)
                }
                .buttonStyle(.plain)
                .accessibilityAddTraits(on ? .isSelected : [])
            }
        }
    }
}
