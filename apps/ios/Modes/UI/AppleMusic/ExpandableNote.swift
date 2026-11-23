import SwiftUI

struct ExpandableNote: View {
    let text: String
    let background: Color
    @State private var expanded = false

    var body: some View {
        Text(text).font(.footnote).opacity(0.85).lineLimit(expanded ? nil : 2).multilineTextAlignment(.leading)
            .frame(maxWidth: .infinity, alignment: .leading)
            .overlay(alignment: .bottomTrailing) {
                if !expanded {
                    Text("MORE").font(.footnote.weight(.bold)).padding(.leading, 28)
                        .background(LinearGradient(colors: [background.opacity(0), background, background], startPoint: .leading, endPoint: .trailing))
                }
            }
            .contentShape(.rect)
            .onTapGesture { withAnimation(.snappy(duration: 0.3)) { expanded = true } }
    }
}
