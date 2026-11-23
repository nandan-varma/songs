// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "ModesCore",
    platforms: [.iOS("26.0"), .macOS("15.0")],
    products: [.library(name: "ModesCore", targets: ["ModesCore"])],
    targets: [
        .target(name: "ModesCore"),
        .testTarget(name: "ModesCoreTests", dependencies: ["ModesCore"], resources: [.copy("Resources")])
    ]
)
