import MediaPlayer
import SwiftUI

struct SystemVolumeSlider: UIViewRepresentable {
    func makeUIView(context: Context) -> ThinVolumeView { ThinVolumeView(frame: .zero) }
    func updateUIView(_ uiView: ThinVolumeView, context: Context) {}
}

final class ThinVolumeView: MPVolumeView {
    private static let thumbSide: CGFloat = 28
    private static let touchThumb = UIGraphicsImageRenderer(size: CGSize(width: thumbSide, height: thumbSide)).image { _ in }

    private static func track(alpha: CGFloat) -> UIImage {
        let height = PlayerLayout.barThickness
        let size = CGSize(width: height, height: height)
        let image = UIGraphicsImageRenderer(size: size).image { _ in
            UIColor.white.withAlphaComponent(alpha).setFill()
            UIBezierPath(roundedRect: CGRect(origin: .zero, size: size), cornerRadius: height / 2).fill()
        }
        return image.resizableImage(withCapInsets: UIEdgeInsets(top: 0, left: height / 2, bottom: 0, right: height / 2))
    }

    override init(frame: CGRect) {
        super.init(frame: frame)
        showsRouteButton = false
    }

    required init?(coder: NSCoder) { nil }

    override func volumeSliderRect(forBounds bounds: CGRect) -> CGRect {
        CGRect(x: bounds.minX, y: bounds.midY - Self.thumbSide / 2, width: bounds.width, height: Self.thumbSide)
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        guard let slider = subviews.compactMap({ $0 as? UISlider }).first else { return }
        slider.setThumbImage(Self.touchThumb, for: .normal)
        slider.setThumbImage(Self.touchThumb, for: .highlighted)
        slider.setMinimumTrackImage(Self.track(alpha: 0.7), for: .normal)
        slider.setMaximumTrackImage(Self.track(alpha: 0.25), for: .normal)
        slider.frame = volumeSliderRect(forBounds: bounds)
    }
}
