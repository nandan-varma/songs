export function Section({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<section className="space-y-3">
			<h2 className="text-xl font-semibold">{title}</h2>
			{children}
		</section>
	);
}

export function EmptyState({ children }: { children: React.ReactNode }) {
	return (
		<p className="py-12 text-center text-sm text-muted-foreground">
			{children}
		</p>
	);
}
