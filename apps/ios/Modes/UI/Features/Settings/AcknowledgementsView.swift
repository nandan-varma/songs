import SwiftUI

struct AcknowledgementsView: View {
    var body: some View {
        List {
            Section("Open source") {
                row("LNPopupUI", "Expandable player bar. MIT License, Leo Natan.")
            }
            Section("Content") {
                Text("Songs, artwork and charts come from an unofficial JioSaavn API. This prototype isn’t affiliated with or endorsed by JioSaavn.")
                    .font(.footnote).foregroundStyle(.secondary)
            }
        }.navigationTitle("Acknowledgements").navigationBarTitleDisplayMode(.inline)
    }
    private func row(_ title: String, _ detail: String) -> some View {
        VStack(alignment: .leading, spacing: 2) { Text(title); Text(detail).font(.footnote).foregroundStyle(.secondary).captionBlock(lines: 3) }
    }
}
