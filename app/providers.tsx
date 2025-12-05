"use client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type * as React from "react";
import { getQueryClient } from "@/app/get-query-client";
import { ErrorBoundary } from "@/components/error-boundary";
import { DownloadsProvider } from "@/contexts/downloads-context";
import { OfflineProvider } from "@/contexts/offline-context";
import { PlayerProvider } from "@/contexts/player-context";

export default function Providers({ children }: { children: React.ReactNode }) {
	const queryClient = getQueryClient();

	return (
		<QueryClientProvider client={queryClient}>
			<ErrorBoundary context="DownloadsProvider">
				<DownloadsProvider>
					<ErrorBoundary context="OfflineProvider">
						<OfflineProvider>
							<ErrorBoundary context="PlayerProvider">
								<PlayerProvider>
									{children}
									<ReactQueryDevtools />
								</PlayerProvider>
							</ErrorBoundary>
						</OfflineProvider>
					</ErrorBoundary>
				</DownloadsProvider>
			</ErrorBoundary>
		</QueryClientProvider>
	);
}
