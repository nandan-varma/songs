import Testing
@testable import ModesCore

struct PlayerTintTests {
    @Test(arguments: [(0.15, 1.0, 1.0), (0.0, 0.0, 1.0), (0.75, 0.9, 0.3), (0.6, 0.2, 0.5), (0.33, 1.0, 0.9)])
    func whiteTextAlwaysReadsOnTheTint(_ input: (Double, Double, Double)) {
        let tint = PlayerTint.calm(hue: input.0, saturation: input.1, brightness: input.2)
        #expect(PlayerTint.luminance(tint) <= PlayerTint.maximumLuminance)
        #expect(tint.brightness >= 0.1 && tint.brightness <= 0.4)
    }

    @Test func aMidPurpleKeepsItsCharacter() {
        let tint = PlayerTint.calm(hue: 0.75, saturation: 0.5, brightness: 0.5)
        #expect(tint.hue == 0.75)
        #expect(abs(tint.saturation - 0.325) < 1e-9)
        #expect(PlayerTint.brightnessRange.contains(tint.brightness))
    }

    @Test func greyCoversStayGrey() {
        #expect(PlayerTint.calm(hue: 0.3, saturation: 0.02, brightness: 0.9).saturation < 0.02)
    }
}
