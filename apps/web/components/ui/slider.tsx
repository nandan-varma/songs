import { Slider as SliderPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/utils";

export function Slider({
	className,
	...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
	return (
		<SliderPrimitive.Root
			className={cn(
				"relative flex w-full touch-none items-center select-none py-2",
				className,
			)}
			{...props}
		>
			<SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-secondary">
				<SliderPrimitive.Range className="absolute h-full bg-primary" />
			</SliderPrimitive.Track>
			<SliderPrimitive.Thumb className="block size-3 rounded-full bg-primary shadow outline-none focus-visible:ring-2 focus-visible:ring-ring" />
		</SliderPrimitive.Root>
	);
}
