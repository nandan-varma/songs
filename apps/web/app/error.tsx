"use client";

import { ErrorState } from "@/components/states";

export default function ErrorPage({
	error,
	reset,
}: {
	error: Error;
	reset: () => void;
}) {
	return <ErrorState message={error.message} onRetry={reset} />;
}
