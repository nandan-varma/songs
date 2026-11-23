import Testing
@testable import ModesCore

struct StreamQualityTests {
    private let all = [12, 48, 96, 160, 320]

    @Test func eachPreferenceTakesTheBestRateWithinItsCeiling() {
        #expect(StreamQuality.pick(preference: .low, available: all) == 96)
        #expect(StreamQuality.pick(preference: .normal, available: all) == 160)
        #expect(StreamQuality.pick(preference: .high, available: all) == 320)
        #expect(StreamQuality.pick(preference: .auto, available: all) == 320)
    }

    @Test func missingRatesFallBackToTheNearestAllowedOrLowest() {
        #expect(StreamQuality.pick(preference: .high, available: [96, 160]) == 160)
        #expect(StreamQuality.pick(preference: .low, available: [160, 320]) == 160)
        #expect(StreamQuality.pick(preference: .normal, available: [48]) == 48)
        #expect(StreamQuality.pick(preference: .auto, available: []) == nil)
    }

    @Test func cellularDataSaverForcesLowButWifiIsUntouched() {
        #expect(StreamQuality.preference(wifi: .high, cellular: .normal, network: .cellular, dataSaver: true) == .low)
        #expect(StreamQuality.preference(wifi: .high, cellular: .normal, network: .cellular, dataSaver: false) == .normal)
        #expect(StreamQuality.preference(wifi: .high, cellular: .low, network: .wifi, dataSaver: true) == .high)
    }

    @Test func bitratesParseFromTheApiLabels() {
        #expect(StreamQuality.bitrate(of: "160kbps") == 160)
        #expect(StreamQuality.bitrate(of: "x") == nil)
    }
}
