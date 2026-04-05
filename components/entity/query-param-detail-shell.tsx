import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface QueryParamDetailShellProps {
	id: string | null;
	entityLabel: string;
	isOffline: boolean;
	isPending: boolean;
	error?: Error | null;
	hasData: boolean;
	loadingFallback: ReactNode;
	children: ReactNode;
}

function formatEntityLabel(entityLabel: string) {
	return entityLabel.charAt(0).toUpperCase() + entityLabel.slice(1);
}

export function QueryParamDetailShell({
	id,
	entityLabel,
	isOffline,
	isPending,
	error,
	hasData,
	loadingFallback,
	children,
}: QueryParamDetailShellProps) {
	const label = formatEntityLabel(entityLabel);

	if (!id) {
		return (
			<div className="container mx-auto px-4 py-8">
				<p className="text-center text-destructive">{label} ID is required</p>
			</div>
		);
	}

	if (isOffline) {
		return (
			<div className="container mx-auto px-4 py-8">
				<Card className="py-12 text-center">
					<CardContent>
						<p className="text-muted-foreground">
							{label} details are not available in offline mode. Please disable
							offline mode to view this {entityLabel}.
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (isPending) {
		return <>{loadingFallback}</>;
	}

	if (error || !hasData) {
		return (
			<div className="container mx-auto px-4 py-8">
				<p className="text-center text-destructive">
					{error instanceof Error ? error.message : `${label} not found`}
				</p>
			</div>
		);
	}

	return <>{children}</>;
}
