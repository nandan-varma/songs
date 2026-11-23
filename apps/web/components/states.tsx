import { Button } from "@/components/ui/button";

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
	return (
		<div className="space-y-1 py-12 text-center">
			<p className="font-medium">{title}</p>
			{hint && <p className="text-sm text-muted-foreground">{hint}</p>}
		</div>
	);
}

export function ErrorState({
	message = "Something went wrong.",
	onRetry,
}: {
	message?: string;
	onRetry?: () => void;
}) {
	return (
		<div role="alert" className="space-y-3 py-12 text-center">
			<p className="text-sm text-muted-foreground">{message}</p>
			{onRetry && (
				<Button variant="secondary" onClick={onRetry}>
					Try again
				</Button>
			)}
		</div>
	);
}
