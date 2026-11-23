import AVKit
import SwiftUI

struct AirPlayButton: UIViewRepresentable {
    func makeUIView(context: Context) -> AVRoutePickerView {
        let v = AVRoutePickerView(frame: .zero)
        v.tintColor = UIColor.white.withAlphaComponent(0.78)
        v.activeTintColor = .white
        v.prioritizesVideoDevices = false
        v.accessibilityLabel = "AirPlay"
        return v
    }
    func updateUIView(_ uiView: AVRoutePickerView, context: Context) {}
}
