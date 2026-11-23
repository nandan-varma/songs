import MediaPlayer
import SwiftUI

struct SystemVolumeSlider: UIViewRepresentable {
    func makeUIView(context: Context) -> ThinVolumeView { ThinVolumeView(frame: .zero) }
    func updateUIView(_ uiView: ThinVolumeView, context: Context) {}
}

final class ThinVolumeView: MPVolumeView {
    private static let touchThumb = UIGraphicsImageRenderer(size: CGSize(width: 28, height: 28)).image { _ in }

    override init(frame: CGRect) {
        super.init(frame: frame)
        showsRouteButton = false
    }

    required init?(coder: NSCoder) { nil }

    override func layoutSubviews() {
        super.layoutSubviews()
        guard let slider = subviews.compactMap({ $0 as? UISlider }).first else { return }
        slider.setThumbImage(Self.touchThumb, for: .normal)
        slider.setThumbImage(Self.touchThumb, for: .highlighted)
        slider.minimumTrackTintColor = UIColor.white.withAlphaComponent(0.7)
        slider.maximumTrackTintColor = UIColor.white.withAlphaComponent(0.25)
    }
}
