"use client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type * as React from "react";
import { getQueryClient } from "@/app/get-query-client";
import { ErrorBoundary } from "@/components/common/error-boundary";
import { DownloadsProvider } from "@/contexts/downloads-context";
import { FavoritesProvider } from "@/contexts/favorites-context";
import { HistoryProvider } from "@/contexts/history-context";
import { LocalPlaylistsProvider } from "@/contexts/local-playlists-context";
import { OfflineProvider } from "@/contexts/offline-context";
import { PlayerProvider } from "@/contexts/player-context";
import { QueueProvider } from "@/contexts/queue-context";

export default function Providers({ children }: { children: React.ReactNode }) {
	const queryClient = getQueryClient();

	return (
		<QueryClientProvider client={queryClient}>
			<ErrorBoundary context="QueueProvider">
				<QueueProvider>
					<ErrorBoundary context="DownloadsProvider">
						<DownloadsProvider>
							<ErrorBoundary context="OfflineProvider">
								<OfflineProvider>
									<ErrorBoundary context="FavoritesProvider">
										<FavoritesProvider>
											<ErrorBoundary context="LocalPlaylistsProvider">
												<LocalPlaylistsProvider>
													<ErrorBoundary context="PlayerProvider">
														<PlayerProvider>
															<ErrorBoundary context="HistoryProvider">
																<HistoryProvider>
																	{children}
																	{process.env.NODE_ENV === "development" && (
																		<ReactQueryDevtools />
																	)}
																</HistoryProvider>
															</ErrorBoundary>
														</PlayerProvider>
													</ErrorBoundary>
												</LocalPlaylistsProvider>
											</ErrorBoundary>
										</FavoritesProvider>
									</ErrorBoundary>
								</OfflineProvider>
							</ErrorBoundary>
						</DownloadsProvider>
					</ErrorBoundary>
				</QueueProvider>
			</ErrorBoundary>
		</QueryClientProvider>
	);
}
