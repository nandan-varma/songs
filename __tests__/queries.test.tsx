import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAlbum } from "../hooks/queries";
import * as api from "../lib/api";

// Mock API
jest.mock("../lib/api", () => ({
	getAlbumById: jest.fn(),
}));

const mockAlbum = {
	id: "1",
	name: "Test Album",
	artists: [],
	songs: [],
};

describe("useAlbum", () => {
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
