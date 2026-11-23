import SwiftUI

struct LogoMark: View {
    var size: CGFloat = 88

    private static let heights: [CGFloat] = [0.52, 0.34, 0.20, 0.34, 0.52]
    private static let purple = Color(red: 0.588, green: 0.157, blue: 0.863)

    var body: some View {
        RoundedRectangle(cornerRadius: size * 0.22, style: .continuous)
            .fill(LinearGradient(colors: [.brand, Self.purple], startPoint: .topLeading, endPoint: .bottomTrailing))
            .overlay {
                HStack(spacing: size * 0.056) {
                    ForEach(Self.heights.indices, id: \.self) { i in
                        Capsule().fill(.white).frame(width: size * 0.092, height: size * Self.heights[i])
                    }
                }
            }
            .overlay {
                Circle().fill(.white).frame(width: size * 0.075, height: size * 0.075)
                    .offset(y: -size * (0.10 + 0.056 + 0.0375))
            }
            .frame(width: size, height: size)
            .accessibilityHidden(true)
    }
}
