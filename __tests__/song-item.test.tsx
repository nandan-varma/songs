import { render, screen } from "@testing-library/react";
import { SongItem } from "@/components/song-item";

// Mock the context hooks
jest.mock("@/contexts/player-context", () => ({
	usePlayer: () => ({
		playSong: jest.fn(),
		currentSong: null,
		isPlaying: false,
	}),
}));

jest.mock("@/contexts/downloads-context", () => ({
	useDownloads: () => ({
		isDownloaded: jest.fn(() => false),
		downloadSong: jest.fn(),
	}),
}));

const mockSong = {
	id: "1",
	name: "Test Song",
	primaryArtists: "Test Artist",
	image: [{ quality: "50x50", url: "test.jpg" }],
	duration: 180,
};

describe("SongItem", () => {
	it("renders song information correctly", () => {
		render(<SongItem song={mockSong} />);

		expect(screen.getByText("Test Song")).toBeInTheDocument();
		expect(screen.getByText("Test Artist")).toBeInTheDocument();
	});

	it("displays formatted duration", () => {
		render(<SongItem song={mockSong} />);

		expect(screen.getByText("3:00")).toBeInTheDocument();
	});
});
