import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
	DownloadsProvider,
	useDownloads,
	useDownloadsActions,
	useDownloadsState,
} from "../../contexts/downloads-context";
import type { DetailedSong } from "../../lib/types";

// Mock the musicDB
jest.mock("../../lib/db", () => ({
	musicDB: {
		getAllSongs: jest.fn(),
		getAudioBlob: jest.fn(),
		saveSong: jest.fn(),
		saveAudioBlob: jest.fn(),
		saveImageBlob: jest.fn(),
		deleteSong: jest.fn(),
	},
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock window.showDirectoryPicker
const mockShowDirectoryPicker = jest.fn();
Object.defineProperty(window, "showDirectoryPicker", {
	writable: true,
	value: mockShowDirectoryPicker,
});

const mockSong: DetailedSong = {
	id: "song1",
	name: "Test Song",
	type: "song" as const,
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

const TestComponent = () => {
	const downloads = useDownloads();
	const _state = useDownloadsState();
	const actions = useDownloadsActions();

	return (
		<div>
			<div data-testid="cached-count">{downloads.cachedSongs.size}</div>
			<div data-testid="is-downloading">
				{downloads.isDownloading.toString()}
			</div>
			<button
				type="button"
				data-testid="download-btn"
				onClick={() => actions.downloadSong(mockSong)}
			>
				Download
			</button>
			<button
				type="button"
				data-testid="remove-btn"
				onClick={() => actions.removeSong("song1")}
			>
				Remove
			</button>
			<button
				type="button"
				data-testid="save-btn"
				onClick={() => actions.saveToDevice()}
			>
				Save to Device
			</button>
			<div data-testid="is-cached">
				{actions.isSongCached("song1").toString()}
			</div>
			<div data-testid="blob-size">
				{actions.getSongBlob("song1")?.size || 0}
			</div>
		</div>
	);
};

describe("DownloadsContext", () => {
	const mockMusicDB = require("../../lib/db").musicDB;

	beforeEach(() => {
		jest.clearAllMocks();

		// Reset mocks
		mockMusicDB.getAllSongs.mockResolvedValue([]);
		mockMusicDB.getAudioBlob.mockResolvedValue(null);
		mockMusicDB.deleteSong.mockResolvedValue(undefined);
		mockFetch.mockResolvedValue({
			ok: true,
			blob: jest
				.fn()
				.mockResolvedValue(new Blob(["test"], { type: "audio/mp3" })),
		});
	});

	it("provides initial state", () => {
		render(
			<DownloadsProvider>
				<TestComponent />
			</DownloadsProvider>,
		);

		expect(screen.getByTestId("cached-count").textContent).toBe("0");
		expect(screen.getByTestId("is-downloading").textContent).toBe("false");
		expect(screen.getByTestId("is-cached").textContent).toBe("false");
		expect(screen.getByTestId("blob-size").textContent).toBe("0");
	});

	it("loads cached songs on mount", async () => {
		const mockCachedSong = {
			id: "song1",
			metadata: mockSong,
			cachedAt: new Date().toISOString(),
		};
		const mockBlob = new Blob(["test"], { type: "audio/mp3" });

		mockMusicDB.getAllSongs.mockResolvedValue([mockCachedSong]);
		mockMusicDB.getAudioBlob.mockResolvedValue(mockBlob);

		render(
			<DownloadsProvider>
				<TestComponent />
			</DownloadsProvider>,
		);

		await waitFor(() => {
			expect(screen.getByTestId("cached-count").textContent).toBe("1");
		});

		expect(mockMusicDB.getAllSongs).toHaveBeenCalled();
		expect(mockMusicDB.getAudioBlob).toHaveBeenCalledWith("song1");
	});

	it("downloads a song successfully", async () => {
		const user = userEvent.setup();

		render(
			<DownloadsProvider>
				<TestComponent />
			</DownloadsProvider>,
		);

		await user.click(screen.getByTestId("download-btn"));

		await waitFor(() => {
			expect(screen.getByTestId("is-downloading").textContent).toBe("false");
		});

		expect(mockFetch).toHaveBeenCalledWith("audio.mp3");
		expect(mockMusicDB.saveSong).toHaveBeenCalledWith(mockSong);
		expect(mockMusicDB.saveAudioBlob).toHaveBeenCalledWith(
			"song1",
			expect.any(Blob),
		);
		expect(screen.getByTestId("is-cached").textContent).toBe("true");
	});

	it("handles download errors gracefully", async () => {
		const user = userEvent.setup();
		const consoleSpy = jest.spyOn(console, "error").mockImplementation();

		mockFetch.mockRejectedValue(new Error("Network error"));

		render(
			<DownloadsProvider>
				<TestComponent />
			</DownloadsProvider>,
		);

		await user.click(screen.getByTestId("download-btn"));

		await waitFor(() => {
			expect(screen.getByTestId("is-downloading").textContent).toBe("false");
		});

		expect(consoleSpy).toHaveBeenCalledWith(
			expect.stringContaining("Error downloading song"),
			expect.any(Error),
		);

		consoleSpy.mockRestore();
	});

	it("removes a song from cache", async () => {
		const user = userEvent.setup();

		// First download a song
		render(
			<DownloadsProvider>
				<TestComponent />
			</DownloadsProvider>,
		);

		await user.click(screen.getByTestId("download-btn"));

		await waitFor(() => {
			expect(screen.getByTestId("is-cached").textContent).toBe("true");
		});

		// Then remove it
		await user.click(screen.getByTestId("remove-btn"));

		expect(screen.getByTestId("is-cached").textContent).toBe("false");
		expect(mockMusicDB.deleteSong).toHaveBeenCalledWith("song1");
	});

	it("prevents downloading already cached songs", async () => {
		const user = userEvent.setup();

		render(
			<DownloadsProvider>
				<TestComponent />
			</DownloadsProvider>,
		);

		// Download once
		await user.click(screen.getByTestId("download-btn"));

		await waitFor(() => {
			expect(screen.getByTestId("is-cached").textContent).toBe("true");
		});

		// Reset the mock to check if it's called again
		mockFetch.mockClear();

		// Try to download again
		await user.click(screen.getByTestId("download-btn"));

		// Should not have been called again
		expect(mockFetch).not.toHaveBeenCalled();
	});

	it("prevents concurrent downloads", async () => {
		const user = userEvent.setup();

		// Make download take longer
		mockFetch.mockImplementation(
			() =>
				new Promise((resolve) =>
					setTimeout(
						() =>
							resolve({
								ok: true,
								blob: jest.fn().mockResolvedValue(new Blob(["test"])),
							}),
						100,
					),
				),
		);

		render(
			<DownloadsProvider>
				<TestComponent />
			</DownloadsProvider>,
		);

		// Start first download
		await user.click(screen.getByTestId("download-btn"));

		expect(screen.getByTestId("is-downloading").textContent).toBe("true");

		// Try to start second download while first is in progress
		await user.click(screen.getByTestId("download-btn"));

		// Should still only have been called once
		expect(mockFetch).toHaveBeenCalledTimes(1);
	});

	it("saves files to device", async () => {
		const user = userEvent.setup();

		// Mock directory picker
		const mockDirHandle = {
			getFileHandle: jest.fn().mockResolvedValue({
				createWritable: jest.fn().mockResolvedValue({
					write: jest.fn().mockResolvedValue(undefined),
					close: jest.fn().mockResolvedValue(undefined),
				}),
			}),
		};
		mockShowDirectoryPicker.mockResolvedValue(mockDirHandle);

		// First download a song
		render(
			<DownloadsProvider>
				<TestComponent />
			</DownloadsProvider>,
		);

		await user.click(screen.getByTestId("download-btn"));

		await waitFor(() => {
			expect(screen.getByTestId("is-cached").textContent).toBe("true");
		});

		// Mock window.alert
		const alertSpy = jest.spyOn(window, "alert").mockImplementation();

		// Save to device
		await user.click(screen.getByTestId("save-btn"));

		expect(mockShowDirectoryPicker).toHaveBeenCalled();
		expect(mockDirHandle.getFileHandle).toHaveBeenCalledWith("Test_Song.mp3", {
			create: true,
		});
		expect(alertSpy).toHaveBeenCalledWith("Successfully saved 1 song!");

		alertSpy.mockRestore();
	});

	it("handles save to device errors", async () => {
		const user = userEvent.setup();

		// First download a song
		render(
			<DownloadsProvider>
				<TestComponent />
			</DownloadsProvider>,
		);

		await user.click(screen.getByTestId("download-btn"));

		await waitFor(() => {
			expect(screen.getByTestId("is-cached").textContent).toBe("true");
		});

		// Now test save error
		mockShowDirectoryPicker.mockRejectedValue(new Error("User cancelled"));

		const alertSpy = jest.spyOn(window, "alert").mockImplementation();

		await user.click(screen.getByTestId("save-btn"));

		expect(alertSpy).toHaveBeenCalledWith(
			"Failed to save files. Please try again.",
		);

		alertSpy.mockRestore();
	});

	it("throws error when hooks used outside provider", () => {
		const TestHook = () => {
			useDownloads();
			return null;
		};

		expect(() => render(<TestHook />)).toThrow(
			"useDownloadsState must be used within a DownloadsProvider",
		);
	});

	it("provides correct blob data", async () => {
		const user = userEvent.setup();
		const mockBlob = new Blob(["test content"], { type: "audio/mp3" });

		mockFetch.mockResolvedValue({
			ok: true,
			blob: jest.fn().mockResolvedValue(mockBlob),
		});

		render(
			<DownloadsProvider>
				<TestComponent />
			</DownloadsProvider>,
		);

		await user.click(screen.getByTestId("download-btn"));

		await waitFor(() => {
			expect(screen.getByTestId("is-downloading").textContent).toBe("false");
		});
	});
});
