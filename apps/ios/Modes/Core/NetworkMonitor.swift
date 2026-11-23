import ModesCore
import Network
import Observation

@MainActor @Observable
final class NetworkMonitor {
    private(set) var kind = NetworkKind.wifi

    @ObservationIgnored var onChange: (() -> Void)?
    @ObservationIgnored private let monitor = NWPathMonitor()

    init() {
        monitor.pathUpdateHandler = { [weak self] path in
            let kind: NetworkKind = path.isExpensive ? .cellular : .wifi
            Task { @MainActor in self?.update(kind) }
        }
        monitor.start(queue: DispatchQueue(label: "com.nandanvarma.modes.network", qos: .utility))
    }

    private func update(_ new: NetworkKind) {
        guard new != kind else { return }
        kind = new
        onChange?()
    }
}
