"use client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type * as React from "react";
import { getQueryClient } from "@/app/get-query-client";
import { ErrorBoundary } from "@/components/common/error-boundary";

export default function Providers({ children }: { children: React.ReactNode }) {
	const queryClient = getQueryClient();

	return (
		<QueryClientProvider client={queryClient}>
			<ErrorBoundary context="App">
				{children}
				{process.env.NODE_ENV === "development" && <ReactQueryDevtools />}
			</ErrorBoundary>
		</QueryClientProvider>
	);
}
