import type * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
	return (
		<input
			className={cn(
				"h-11 w-full rounded-md border border-input bg-background px-3 text-base placeholder:text-muted-foreground",
				className,
			)}
			{...props}
		/>
	);
}
