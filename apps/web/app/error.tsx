"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
	error,
	reset,
}: {
	error: Error;
	reset: () => void;
}) {
	return (
		<div className="flex flex-col items-center gap-4 py-24 text-center">
			<h1 className="text-xl font-semibold">Something went wrong</h1>
			<p className="max-w-sm text-sm text-muted-foreground">{error.message}</p>
			<Button onClick={reset}>Try again</Button>
		</div>
	);
}
