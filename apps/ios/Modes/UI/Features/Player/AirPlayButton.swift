import AVKit
import SwiftUI

/// The system AirPlay route picker. It has to be the native view: it owns the route sheet and the active-route state.
struct AirPlayButton: UIViewRepresentable {
    func makeUIView(context: Context) -> AVRoutePickerView {
        let v = AVRoutePickerView(frame: .zero)
        v.tintColor = UIColor.white.withAlphaComponent(0.8)     // matches the other row icons
        v.activeTintColor = UIColor(Color.brand)
        v.prioritizesVideoDevices = false                       // this is an audio app
        v.accessibilityLabel = "AirPlay"
        return v
    }
    func updateUIView(_ uiView: AVRoutePickerView, context: Context) {}
}
