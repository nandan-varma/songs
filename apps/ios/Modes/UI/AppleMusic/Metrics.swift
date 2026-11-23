import SwiftUI

struct Metrics: Equatable {
    var width: CGFloat = 402

    var unit: CGFloat { min(max(width / 402, 0.8), 1.7) }
    var inset: CGFloat { 20 * unit }
    var gap: CGFloat { 12 * unit }
    var card: CGFloat { min(width * 0.4, 260) }
    var cardRadius: CGFloat { card * 0.05 }
    var rowArtwork: CGFloat { 56 * unit }
    var rowRadius: CGFloat { rowArtwork * 0.07 }
    var tallWidth: CGFloat { min(width * 0.615, 400) }
    var tallHeight: CGFloat { tallWidth * 1.33 }
    var tallRadius: CGFloat { tallWidth * 0.055 }
    var shelfSpacing: CGFloat { 26 * unit }
    var textInset: CGFloat { inset + rowArtwork + gap }
    var heroArtwork: CGFloat { min(width * 0.7, 420) }
}

private struct MetricsKey: EnvironmentKey {
    static let defaultValue = Metrics()
}

extension EnvironmentValues {
    var metrics: Metrics {
        get { self[MetricsKey.self] }
        set { self[MetricsKey.self] = newValue }
    }
}

extension View {
    func trackMetrics(_ metrics: Binding<Metrics>) -> some View {
        onGeometryChange(for: CGFloat.self) { $0.size.width } action: { width in
            if abs(metrics.wrappedValue.width - width) > 0.5 { metrics.wrappedValue = Metrics(width: width) }
        }
        .environment(\.metrics, metrics.wrappedValue)
    }
}

extension Font {
    static let amLargeTitle = Font.largeTitle.weight(.bold)
    static let amSection = Font.title3.weight(.bold)
    static let amCardTitle = Font.subheadline
    static let amRowTitle = Font.body
    static let amRowSubtitle = Font.subheadline
    static let amTrackTitle = Font.body
}
