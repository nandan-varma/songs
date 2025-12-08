import {
	searchMusic,
	searchSongs,
	getSongById,
	getAlbumById,
} from "../../lib/api";

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("API functions", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("searchMusic", () => {
		it("fetches search results successfully", async () => {
			const mockResponse = {
				songs: [],
				albums: [],
				artists: [],
				playlists: [],
			};

			mockFetch.mockResolvedValue({
				ok: true,
				json: jest.fn().mockResolvedValue(mockResponse),
			});

			const result = await searchMusic("test query");

			expect(mockFetch).toHaveBeenCalledWith(
				"https://saavn-api.nandanvarma.com/api/search?query=test%20query",
			);
			expect(result).toEqual(mockResponse);
		});

		it("throws error on failed response", async () => {
			mockFetch.mockResolvedValue({
				ok: false,
			});

			await expect(searchMusic("test")).rejects.toThrow(
				"Failed to fetch search results",
			);
		});
	});

	describe("searchSongs", () => {
		it("fetches songs with default parameters", async () => {
			const mockResponse = {
				data: {
					total: 100,
					results: [],
				},
			};

			mockFetch.mockResolvedValue({
				ok: true,
				json: jest.fn().mockResolvedValue(mockResponse),
			});

			const result = await searchSongs("test");

			expect(mockFetch).toHaveBeenCalledWith(
				"https://saavn-api.nandanvarma.com/api/search/songs?query=test&page=0&limit=10",
			);
			expect(result).toEqual(mockResponse);
		});

		it("fetches songs with custom parameters", async () => {
			const mockResponse = {
				data: {
					total: 50,
					results: [],
				},
			};

			mockFetch.mockResolvedValue({
				ok: true,
				json: jest.fn().mockResolvedValue(mockResponse),
			});

			const result = await searchSongs("test", 1, 20);

			expect(mockFetch).toHaveBeenCalledWith(
				"https://saavn-api.nandanvarma.com/api/search/songs?query=test&page=1&limit=20",
			);
			expect(result).toEqual(mockResponse);
		});

		it("throws error on failed response", async () => {
			mockFetch.mockResolvedValue({
				ok: false,
			});

			await expect(searchSongs("test")).rejects.toThrow(
				"Failed to search songs",
			);
		});
	});

	describe("getSongById", () => {
		it("fetches song by id", async () => {
			const mockResponse = {
				data: [],
			};

			mockFetch.mockResolvedValue({
				ok: true,
				json: jest.fn().mockResolvedValue(mockResponse),
			});

			const result = await getSongById("song123");

			expect(mockFetch).toHaveBeenCalledWith(
				"https://saavn-api.nandanvarma.com/api/songs/song123",
			);
			expect(result).toEqual(mockResponse);
		});

		it("throws error on failed response", async () => {
			mockFetch.mockResolvedValue({
				ok: false,
			});

			await expect(getSongById("song123")).rejects.toThrow(
				"Failed to fetch song",
			);
		});
	});

	describe("getAlbumById", () => {
		it("fetches album by id", async () => {
			const mockResponse = {
				data: {
					id: "album123",
					name: "Test Album",
				},
			};

			mockFetch.mockResolvedValue({
				ok: true,
				json: jest.fn().mockResolvedValue(mockResponse),
			});

			const result = await getAlbumById("album123");

			expect(mockFetch).toHaveBeenCalledWith(
				"https://saavn-api.nandanvarma.com/api/albums?id=album123",
			);
			expect(result).toEqual(mockResponse);
		});

		it("throws error on failed response", async () => {
			mockFetch.mockResolvedValue({
				ok: false,
			});

			await expect(getAlbumById("album123")).rejects.toThrow(
				"Failed to fetch album",
			);
		});
	});
});
