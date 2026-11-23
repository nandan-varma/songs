export function Section({
	title,
	action,
	children,
}: {
	title: string;
	action?: React.ReactNode;
	children: React.ReactNode;
}) {
	return (
		<section className="space-y-3">
			<div className="flex min-h-11 items-center justify-between gap-2">
				<h2 className="text-xl font-semibold">{title}</h2>
				{action}
			</div>
			{children}
		</section>
	);
}
