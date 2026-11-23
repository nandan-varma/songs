import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"inline-flex shrink-0 items-center justify-center gap-2 text-sm font-medium whitespace-nowrap transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
	{
		variants: {
			variant: {
				default:
					"rounded-md bg-primary text-primary-foreground hover:bg-primary/90",
				secondary:
					"rounded-md bg-secondary text-secondary-foreground hover:bg-accent",
				ghost: "rounded-md hover:bg-accent hover:text-accent-foreground",
				chip: "rounded-full bg-secondary text-secondary-foreground hover:bg-accent data-[active=true]:bg-primary data-[active=true]:text-primary-foreground",
			},
			size: {
				default: "h-11 px-4",
				sm: "h-11 px-3",
				icon: "size-11",
			},
		},
		defaultVariants: { variant: "default", size: "default" },
	},
);

export function Button({
	className,
	variant,
	size,
	asChild = false,
	...props
}: React.ComponentProps<"button"> &
	VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
	const Comp = asChild ? Slot.Root : "button";
	return (
		<Comp
			className={cn(buttonVariants({ variant, size }), className)}
			{...props}
		/>
	);
}
