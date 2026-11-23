import SwiftUI

struct AboutView: View {
    private var version: String {
        let short = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "1.0"
        let build = Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "1"
        return "\(short) (\(build))"
    }

    var body: some View {
        Form {
            Section {
                LabeledContent("Version") { Text(version).monospacedDigit() }
                if let source = URL(string: "https://github.com/nandan-varma/songs") { Link("Source code", destination: source) }
                NavigationLink("Acknowledgements") { AcknowledgementsView() }
            }
            Section("Developer") {
                NavigationLink("Model statistics") { ModelStatsView() }
            }
        }
        .navigationTitle("About").navigationBarTitleDisplayMode(.inline)
    }
}
