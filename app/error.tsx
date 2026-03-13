"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error("Page error:", error);
	}, [error]);

	return (
		<div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
			<AlertTriangle className="h-16 w-16 text-destructive mb-6" />
			<h1 className="text-2xl font-bold mb-2">Oops! Something went wrong</h1>
			<p className="text-muted-foreground mb-6 max-w-md">
				We encountered an unexpected error. This might be a temporary issue.
			</p>
			<div className="flex gap-4">
				<Button onClick={reset} className="flex items-center gap-2">
					<RefreshCw className="h-4 w-4" />
					Try again
				</Button>
				<Button
					variant="outline"
					onClick={() => {
						window.location.href = "/";
					}}
				>
					Go home
				</Button>
			</div>
			{process.env.NODE_ENV === "development" && (
				<details className="mt-8 text-left max-w-2xl">
					<summary className="cursor-pointer text-sm text-muted-foreground">
						Error details (development only)
					</summary>
					<pre className="mt-2 p-4 bg-muted rounded text-xs overflow-auto">
						{error.message}
						{error.stack && `\n\n${error.stack}`}
					</pre>
				</details>
			)}
		</div>
	);
}
