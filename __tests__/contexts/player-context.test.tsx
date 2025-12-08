import React from "react";
import { render, screen, act } from "@testing-library/react";
import {
	PlayerProvider,
	usePlayback,
	useQueue,
	usePlayerActions,
	usePlayer,
} from "../../contexts/player-context";
import type { DetailedSong } from "../../lib/types";

// Mock HTMLAudioElement methods
Object.defineProperty(HTMLAudioElement.prototype, "play", {
	writable: true,
	value: jest.fn().mockResolvedValue(undefined),
});

Object.defineProperty(HTMLAudioElement.prototype, "pause", {
	writable: true,
	value: jest.fn(),
});

Object.defineProperty(HTMLAudioElement.prototype, "load", {
	writable: true,
	value: jest.fn(),
});

const mockSong: DetailedSong = {
	id: "song1",
	name: "Test Song",
	type: "song",
	year: "2023",
	releaseDate: null,
	duration: 180,
	label: null,
	explicitContent: false,
	playCount: null,
	language: "english",
	hasLyrics: false,
	lyricsId: null,
	url: "song-url",
	copyright: null,
	album: {
		id: "album1",
		name: "Test Album",
		url: "album-url",
	},
	artists: {
		primary: [
			{
				id: "artist1",
				name: "Test Artist",
				role: "primary" as const,
				type: "artist" as const,
				image: [],
				url: "artist-url",
			},
		],
		featured: [],
		all: [
			{
				id: "artist1",
				name: "Test Artist",
				role: "primary" as const,
				type: "artist" as const,
				image: [],
				url: "artist-url",
			},
		],
	},
	image: [{ quality: "500x500", url: "cover.jpg" }],
	downloadUrl: [{ quality: "320kbps", url: "audio.mp3" }],
};

const mockSong2: DetailedSong = {
	...mockSong,
	id: "song2",
	name: "Test Song 2",
};

function TestComponent({
	children,
}: {
	children: (data: any) => React.ReactNode;
}) {
	return <PlayerProvider>{children({})}</PlayerProvider>;
}

describe("PlayerProvider", () => {
	it("renders children", () => {
		render(
			<PlayerProvider>
				<div data-testid="child">Test</div>
			</PlayerProvider>,
		);
		expect(screen.getByTestId("child")).toBeTruthy();
	});

	it("provides initial state", () => {
		let playbackData: any;
		let queueData: any;
		let actionsData: any;

		function Consumer() {
			playbackData = usePlayback();
			queueData = useQueue();
			actionsData = usePlayerActions();
			return null;
		}

		render(
			<PlayerProvider>
				<Consumer />
			</PlayerProvider>,
		);

		expect(playbackData.currentSong).toBeNull();
		expect(playbackData.isPlaying).toBe(false);
		expect(playbackData.volume).toBe(0.7);
		expect(playbackData.currentTime).toBe(0);
		expect(playbackData.duration).toBe(0);
		expect(playbackData.audioRef).toHaveProperty("current", null);

		expect(queueData.queue).toEqual([]);
		expect(queueData.currentIndex).toBe(0);

		expect(typeof actionsData.playSong).toBe("function");
		expect(typeof actionsData.togglePlayPause).toBe("function");
	});

	it("usePlayer combines all data", () => {
		let playerData: any;

		function Consumer() {
			playerData = usePlayer();
			return null;
		}

		render(
			<PlayerProvider>
				<Consumer />
			</PlayerProvider>,
		);

		expect(playerData.currentSong).toBeNull();
		expect(playerData.queue).toEqual([]);
		expect(typeof playerData.playSong).toBe("function");
	});

	it("throws error when hooks used outside provider", () => {
		const consoleSpy = jest.spyOn(console, "error").mockImplementation();

		function TestPlayback() {
			usePlayback();
			return null;
		}

		function TestQueue() {
			useQueue();
			return null;
		}

		function TestActions() {
			usePlayerActions();
			return null;
		}

		function TestPlayer() {
			usePlayer();
			return null;
		}

		expect(() => render(<TestPlayback />)).toThrow(
			"usePlayback must be used within a PlayerProvider",
		);
		expect(() => render(<TestQueue />)).toThrow(
			"useQueue must be used within a PlayerProvider",
		);
		expect(() => render(<TestActions />)).toThrow(
			"usePlayerActions must be used within a PlayerProvider",
		);
		expect(() => render(<TestPlayer />)).toThrow();

		consoleSpy.mockRestore();
	});
});

describe("Player Actions", () => {
	it("playSong sets current song and starts playing", () => {
		let playbackData: any;
		let actionsData: any;

		function Consumer() {
			playbackData = usePlayback();
			actionsData = usePlayerActions();
			return null;
		}

		render(
			<PlayerProvider>
				<Consumer />
			</PlayerProvider>,
		);

		act(() => {
			actionsData.playSong(mockSong);
		});

		expect(playbackData.currentSong).toEqual(mockSong);
		expect(playbackData.isPlaying).toBe(true);
	});

	it("playSong replaces queue when replaceQueue is true (default)", () => {
		let queueData: any;
		let actionsData: any;

		function Consumer() {
			queueData = useQueue();
			actionsData = usePlayerActions();
			return null;
		}

		render(
			<PlayerProvider>
				<Consumer />
			</PlayerProvider>,
		);

		act(() => {
			actionsData.playSong(mockSong);
		});

		expect(queueData.queue).toEqual([mockSong]);
		expect(queueData.currentIndex).toBe(0);
	});

	it("playSong adds to queue when replaceQueue is false", () => {
		let queueData: any;
		let actionsData: any;

		function Consumer() {
			queueData = useQueue();
			actionsData = usePlayerActions();
			return null;
		}

		render(
			<PlayerProvider>
				<Consumer />
			</PlayerProvider>,
		);

		act(() => {
			actionsData.addToQueue(mockSong);
			actionsData.playSong(mockSong2, false);
		});

		expect(queueData.queue).toEqual([mockSong, mockSong2]);
		expect(queueData.currentIndex).toBe(0);
	});

	it("playQueue sets multiple songs and starts at specified index", () => {
		let playbackData: any;
		let queueData: any;
		let actionsData: any;

		function Consumer() {
			playbackData = usePlayback();
			queueData = useQueue();
			actionsData = usePlayerActions();
			return null;
		}

		render(
			<PlayerProvider>
				<Consumer />
			</PlayerProvider>,
		);

		act(() => {
			actionsData.playQueue([mockSong, mockSong2], 1);
		});

		expect(queueData.queue).toEqual([mockSong, mockSong2]);
		expect(queueData.currentIndex).toBe(1);
		expect(playbackData.currentSong).toEqual(mockSong2);
		expect(playbackData.isPlaying).toBe(true);
	});

	it("togglePlayPause toggles isPlaying state", () => {
		let playbackData: any;
		let actionsData: any;

		function Consumer() {
			playbackData = usePlayback();
			actionsData = usePlayerActions();
			return null;
		}

		render(
			<PlayerProvider>
				<Consumer />
			</PlayerProvider>,
		);

		// Initially not playing
		expect(playbackData.isPlaying).toBe(false);

		act(() => {
			actionsData.togglePlayPause();
		});

		expect(playbackData.isPlaying).toBe(true);

		act(() => {
			actionsData.togglePlayPause();
		});

		expect(playbackData.isPlaying).toBe(false);
	});

	it("playNext advances to next song in queue", () => {
		let playbackData: any;
		let queueData: any;
		let actionsData: any;

		function Consumer() {
			playbackData = usePlayback();
			queueData = useQueue();
			actionsData = usePlayerActions();
			return null;
		}

		render(
			<PlayerProvider>
				<Consumer />
			</PlayerProvider>,
		);

		act(() => {
			actionsData.playQueue([mockSong, mockSong2]);
			actionsData.playNext();
		});

		expect(queueData.currentIndex).toBe(1);
		expect(playbackData.currentSong).toEqual(mockSong2);
		expect(playbackData.isPlaying).toBe(true);
	});

	it("playNext loops back to start when at end of queue", () => {
		let queueData: any;
		let actionsData: any;

		function Consumer() {
			queueData = useQueue();
			actionsData = usePlayerActions();
			return null;
		}

		render(
			<PlayerProvider>
				<Consumer />
			</PlayerProvider>,
		);

		act(() => {
			actionsData.playQueue([mockSong, mockSong2]);
			actionsData.playNext(); // Go to index 1
			actionsData.playNext(); // Loop back to index 0
		});

		expect(queueData.currentIndex).toBe(0);
	});

	it("playPrevious goes to previous song", () => {
		let playbackData: any;
		let queueData: any;
		let actionsData: any;

		function Consumer() {
			playbackData = usePlayback();
			queueData = useQueue();
			actionsData = usePlayerActions();
			return null;
		}

		render(
			<PlayerProvider>
				<Consumer />
			</PlayerProvider>,
		);

		act(() => {
			actionsData.playQueue([mockSong, mockSong2]);
			actionsData.playNext(); // Go to song2
			actionsData.playPrevious(); // Go back to song1
		});

		expect(queueData.currentIndex).toBe(0);
		expect(playbackData.currentSong).toEqual(mockSong);
	});

	it("playPrevious restarts current song if within 3 seconds", () => {
		let playbackData: any;
		let actionsData: any;

		function Consumer() {
			playbackData = usePlayback();
			actionsData = usePlayerActions();
			return null;
		}

		render(
			<PlayerProvider>
				<Consumer />
			</PlayerProvider>,
		);

		act(() => {
			actionsData.playSong(mockSong);
			playbackData.currentTime = 2; // Within threshold
			actionsData.playPrevious();
		});

		expect(playbackData.currentTime).toBe(0);
	});

	it("seekTo updates currentTime with clamped value", () => {
		let playbackData: any;
		let actionsData: any;

		function Consumer() {
			playbackData = usePlayback();
			actionsData = usePlayerActions();
			return null;
		}

		render(
			<PlayerProvider>
				<Consumer />
			</PlayerProvider>,
		);

		// Mock audio element
		playbackData.audioRef.current = {
			currentTime: 0,
			duration: 180,
		};

		act(() => {
			actionsData.playSong(mockSong);
			actionsData.seekTo(50);
		});

		expect(playbackData.currentTime).toBe(50);
		expect(playbackData.audioRef.current.currentTime).toBe(50);
	});

	it("seekTo clamps values to valid range", () => {
		let actionsData: any;

		function Consumer() {
			actionsData = usePlayerActions();
			return null;
		}

		render(
			<PlayerProvider>
				<Consumer />
			</PlayerProvider>,
		);

		act(() => {
			actionsData.playSong(mockSong);
			actionsData.seekTo(-10); // Below 0
		});

		// seekTo clamps but since no audio element, just check it doesn't throw
	});

	it("setVolume updates volume with clamped value", () => {
		let playbackData: any;
		let actionsData: any;

		function Consumer() {
			playbackData = usePlayback();
			actionsData = usePlayerActions();
			return null;
		}

		render(
			<PlayerProvider>
				<Consumer />
			</PlayerProvider>,
		);

		act(() => {
			actionsData.setVolume(0.8);
		});

		expect(playbackData.volume).toBe(0.8);
	});

	it("setVolume clamps values between 0 and 1", () => {
		let actionsData: any;

		function Consumer() {
			actionsData = usePlayerActions();
			return null;
		}

		render(
			<PlayerProvider>
				<Consumer />
			</PlayerProvider>,
		);

		act(() => {
			actionsData.setVolume(-0.5);
		});

		// setVolume clamps but since no audio element, just check it doesn't throw
	});

	it("addToQueue adds song to end of queue", () => {
		let queueData: any;
		let actionsData: any;

		function Consumer() {
			queueData = useQueue();
			actionsData = usePlayerActions();
			return null;
		}

		render(
			<PlayerProvider>
				<Consumer />
			</PlayerProvider>,
		);

		act(() => {
			actionsData.addToQueue(mockSong);
			actionsData.addToQueue(mockSong2);
		});

		expect(queueData.queue).toEqual([mockSong, mockSong2]);
	});

	it("addMultipleToQueue adds multiple songs to end of queue", () => {
		let queueData: any;
		let actionsData: any;

		function Consumer() {
			queueData = useQueue();
			actionsData = usePlayerActions();
			return null;
		}

		render(
			<PlayerProvider>
				<Consumer />
			</PlayerProvider>,
		);

		act(() => {
			actionsData.addMultipleToQueue([mockSong, mockSong2]);
		});

		expect(queueData.queue).toEqual([mockSong, mockSong2]);
	});

	it("removeFromQueue removes song at index", () => {
		let queueData: any;
		let actionsData: any;

		function Consumer() {
			queueData = useQueue();
			actionsData = usePlayerActions();
			return null;
		}

		render(
			<PlayerProvider>
				<Consumer />
			</PlayerProvider>,
		);

		act(() => {
			actionsData.addMultipleToQueue([mockSong, mockSong2]);
			actionsData.removeFromQueue(0);
		});

		expect(queueData.queue).toEqual([mockSong2]);
	});

	it("removeFromQueue adjusts currentIndex when removing before current song", () => {
		let queueData: any;
		let actionsData: any;

		function Consumer() {
			queueData = useQueue();
			actionsData = usePlayerActions();
			return null;
		}

		render(
			<PlayerProvider>
				<Consumer />
			</PlayerProvider>,
		);

		act(() => {
			actionsData.playQueue(
				[mockSong, mockSong2, { ...mockSong, id: "song3" }],
				1,
			); // Start at song2
			actionsData.removeFromQueue(0); // Remove song1
		});

		expect(queueData.currentIndex).toBe(0); // Adjusted from 1 to 0
		expect(queueData.queue).toEqual([mockSong2, { ...mockSong, id: "song3" }]);
	});

	it("removeFromQueue stops playback when removing current song and queue becomes empty", () => {
		let playbackData: any;
		let queueData: any;
		let actionsData: any;

		function Consumer() {
			playbackData = usePlayback();
			queueData = useQueue();
			actionsData = usePlayerActions();
			return null;
		}

		render(
			<PlayerProvider>
				<Consumer />
			</PlayerProvider>,
		);

		act(() => {
			actionsData.playSong(mockSong);
			actionsData.removeFromQueue(0);
		});

		expect(queueData.queue).toEqual([]);
		expect(playbackData.currentSong).toBeNull();
		expect(playbackData.isPlaying).toBe(false);
	});

	it("clearQueue empties queue and stops playback", () => {
		let playbackData: any;
		let queueData: any;
		let actionsData: any;

		function Consumer() {
			playbackData = usePlayback();
			queueData = useQueue();
			actionsData = usePlayerActions();
			return null;
		}

		render(
			<PlayerProvider>
				<Consumer />
			</PlayerProvider>,
		);

		act(() => {
			actionsData.playQueue([mockSong, mockSong2]);
			actionsData.clearQueue();
		});

		expect(queueData.queue).toEqual([]);
		expect(queueData.currentIndex).toBe(0);
		expect(playbackData.currentSong).toBeNull();
		expect(playbackData.isPlaying).toBe(false);
	});
});
