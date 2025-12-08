import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import {
	useAlbum,
	useArtist,
	useArtistSongs,
	useGlobalSearch,
	usePlaylist,
	useSong,
	useSongSuggestions,
} from "../../hooks/queries";
import * as api from "../../lib/api";

// Mock API
jest.mock("../../lib/api", () => ({
	getAlbumById: jest.fn(),
	getPlaylistById: jest.fn(),
	getSongById: jest.fn(),
	getSongSuggestions: jest.fn(),
	getArtistById: jest.fn(),
	getArtistSongs: jest.fn(),
	getArtistAlbums: jest.fn(),
	searchSongs: jest.fn(),
	searchAlbums: jest.fn(),
	searchArtists: jest.fn(),
	searchPlaylists: jest.fn(),
	searchMusic: jest.fn(),
}));

const mockAlbum = {
	id: "1",
	name: "Test Album",
	artists: [],
	songs: [],
};

const mockPlaylist = {
	id: "1",
	name: "Test Playlist",
	songs: [],
};

const mockSong = [
	{
		id: "1",
		name: "Test Song",
		artists: [],
		album: { name: "Test Album" },
	},
];

const mockSongSuggestions = [
	{
		id: "2",
		name: "Suggested Song",
		artists: [],
		album: { name: "Test Album" },
	},
];

const mockArtist = {
	id: "1",
	name: "Test Artist",
	songs: [],
	albums: [],
};

const mockArtistSongsPage = {
	total: 50,
	songs: mockSong,
};

const _mockArtistAlbumsPage = {
	total: 20,
	albums: [mockAlbum],
};

const _mockSearchSongsPage = {
	total: 100,
	results: mockSong,
};

const _mockSearchAlbumsPage = {
	total: 50,
	results: [mockAlbum],
};

const _mockSearchArtistsPage = {
	total: 30,
	results: [mockArtist],
};

const _mockSearchPlaylistsPage = {
	total: 25,
	results: [mockPlaylist],
};

const mockGlobalSearch = {
	songs: [],
	albums: [],
	artists: [],
	playlists: [],
};

const createTestQueryClient = () =>
	new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
		},
	});

const wrapper = ({ children }: { children: React.ReactNode }) => {
	const queryClient = createTestQueryClient();
	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
};

const infiniteWrapper = ({ children }: { children: React.ReactNode }) => {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
		},
	});
	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
};

describe("useAlbum", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("fetches album data successfully", async () => {
		(api.getAlbumById as jest.Mock).mockResolvedValue({
			data: mockAlbum,
		});

		const { result } = renderHook(() => useAlbum("1"), { wrapper });

		expect(result.current.isLoading).toBe(true);

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.data).toEqual(mockAlbum);
		expect(api.getAlbumById).toHaveBeenCalledWith("1");
	});

	it("handles error state", async () => {
		const error = new Error("Album not found");
		(api.getAlbumById as jest.Mock).mockRejectedValue(error);

		const { result } = renderHook(() => useAlbum("1"), { wrapper });

		await waitFor(() => {
			expect(result.current.isError).toBe(true);
		});

		expect(result.current.error).toEqual(error);
	});
});

describe("usePlaylist", () => {
	it("fetches playlist data successfully", async () => {
		(api.getPlaylistById as jest.Mock).mockResolvedValue({
			data: mockPlaylist,
		});

		const { result } = renderHook(() => usePlaylist("1"), { wrapper });

		expect(result.current.isLoading).toBe(true);

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.data).toEqual(mockPlaylist);
		expect(api.getPlaylistById).toHaveBeenCalledWith("1");
	});

	it("handles error state", async () => {
		const error = new Error("Playlist not found");
		(api.getPlaylistById as jest.Mock).mockRejectedValue(error);

		const { result } = renderHook(() => usePlaylist("1"), { wrapper });

		await waitFor(() => {
			expect(result.current.isError).toBe(true);
		});

		expect(result.current.error).toEqual(error);
	});
});

describe("useSong", () => {
	it("fetches song data successfully", async () => {
		(api.getSongById as jest.Mock).mockResolvedValue({
			data: mockSong,
		});

		const { result } = renderHook(() => useSong("1"), { wrapper });

		expect(result.current.isLoading).toBe(true);

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.data).toEqual(mockSong);
		expect(api.getSongById).toHaveBeenCalledWith("1");
	});

	it("handles error state", async () => {
		const error = new Error("Song not found");
		(api.getSongById as jest.Mock).mockRejectedValue(error);

		const { result } = renderHook(() => useSong("1"), { wrapper });

		await waitFor(() => {
			expect(result.current.isError).toBe(true);
		});

		expect(result.current.error).toEqual(error);
	});
});

describe("useSongSuggestions", () => {
	it("fetches song suggestions successfully", async () => {
		(api.getSongSuggestions as jest.Mock).mockResolvedValue({
			data: mockSongSuggestions,
		});

		const { result } = renderHook(() => useSongSuggestions("1"), { wrapper });

		expect(result.current.isLoading).toBe(true);

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.data).toEqual(mockSongSuggestions);
		expect(api.getSongSuggestions).toHaveBeenCalledWith("1", 10);
	});

	it("handles error state", async () => {
		const error = new Error("Suggestions not found");
		(api.getSongSuggestions as jest.Mock).mockRejectedValue(error);

		const { result } = renderHook(() => useSongSuggestions("1"), { wrapper });

		await waitFor(() => {
			expect(result.current.isError).toBe(true);
		});

		expect(result.current.error).toEqual(error);
	});
});

describe("useArtist", () => {
	it("fetches artist data successfully", async () => {
		(api.getArtistById as jest.Mock).mockResolvedValue({
			data: mockArtist,
		});

		const { result } = renderHook(() => useArtist("1"), { wrapper });

		expect(result.current.isLoading).toBe(true);

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.data).toEqual(mockArtist);
		expect(api.getArtistById).toHaveBeenCalledWith("1", {
			page: 1,
			songCount: 10,
			albumCount: 10,
			sortBy: "popularity",
			sortOrder: "desc",
		});
	});

	it("handles error state", async () => {
		const error = new Error("Artist not found");
		(api.getArtistById as jest.Mock).mockRejectedValue(error);

		const { result } = renderHook(() => useArtist("1"), { wrapper });

		await waitFor(() => {
			expect(result.current.isError).toBe(true);
		});

		expect(result.current.error).toEqual(error);
	});
});

describe("useArtistSongs", () => {
	it("fetches artist songs successfully", async () => {
		(api.getArtistSongs as jest.Mock).mockResolvedValue({
			data: mockArtistSongsPage,
		});

		const { result } = renderHook(
			() => useArtistSongs("1", "popularity", "desc"),
			{ wrapper: infiniteWrapper },
		);

		expect(result.current.isLoading).toBe(true);

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.data?.pages[0]).toEqual(mockArtistSongsPage);
		expect(api.getArtistSongs).toHaveBeenCalledWith(
			"1",
			0,
			"popularity",
			"desc",
		);
	});

	it("handles error state", async () => {
		const error = new Error("Artist songs not found");
		(api.getArtistSongs as jest.Mock).mockRejectedValue(error);

		const { result } = renderHook(
			() => useArtistSongs("1", "popularity", "desc"),
			{ wrapper: infiniteWrapper },
		);

		await waitFor(() => {
			expect(result.current.isError).toBe(true);
		});

		expect(result.current.error).toEqual(error);
	});
});

describe("useArtistSongs", () => {
	it("fetches artist songs successfully", async () => {
		(api.getArtistSongs as jest.Mock).mockResolvedValue({
			data: mockArtistSongsPage,
		});

		const { result } = renderHook(
			() => useArtistSongs("1", "popularity", "desc"),
			{ wrapper: infiniteWrapper },
		);

		expect(result.current.isLoading).toBe(true);

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.data?.pages[0]).toEqual(mockArtistSongsPage);
		expect(api.getArtistSongs).toHaveBeenCalledWith(
			"1",
			0,
			"popularity",
			"desc",
		);
	});

	it("handles error state", async () => {
		const error = new Error("Artist songs not found");
		(api.getArtistSongs as jest.Mock).mockRejectedValue(error);

		const { result } = renderHook(
			() => useArtistSongs("1", "popularity", "desc"),
			{ wrapper: infiniteWrapper },
		);

		await waitFor(() => {
			expect(result.current.isError).toBe(true);
		});

		expect(result.current.error).toEqual(error);
	});
});

describe("useGlobalSearch", () => {
	it("fetches global search results successfully", async () => {
		(api.searchMusic as jest.Mock).mockResolvedValue(mockGlobalSearch);

		const { result } = renderHook(() => useGlobalSearch("test"), { wrapper });

		expect(result.current.isLoading).toBe(true);

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.data).toEqual(mockGlobalSearch);
		expect(api.searchMusic).toHaveBeenCalledWith("test");
	});

	it("handles error state", async () => {
		const error = new Error("Search failed");
		(api.searchMusic as jest.Mock).mockRejectedValue(error);

		const { result } = renderHook(() => useGlobalSearch("test"), { wrapper });

		await waitFor(() => {
			expect(result.current.isError).toBe(true);
		});

		expect(result.current.error).toEqual(error);
	});

	it("is disabled when query is empty", () => {
		const { result } = renderHook(() => useGlobalSearch(""), { wrapper });

		expect(result.current.isFetching).toBe(false);
		expect(result.current.data).toBeUndefined();
	});
});
