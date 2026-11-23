import { DropdownMenu as MenuPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/utils";

export const DropdownMenu = MenuPrimitive.Root;
export const DropdownMenuTrigger = MenuPrimitive.Trigger;
export const DropdownMenuSub = MenuPrimitive.Sub;

const itemClass =
	"flex min-h-11 cursor-default items-center gap-2 rounded-md px-3 text-sm outline-none select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0";

const panelClass =
	"z-50 min-w-44 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:duration-150";

export function DropdownMenuContent({
	className,
	...props
}: React.ComponentProps<typeof MenuPrimitive.Content>) {
	return (
		<MenuPrimitive.Portal>
			<MenuPrimitive.Content
				align="end"
				sideOffset={4}
				className={cn(panelClass, className)}
				{...props}
			/>
		</MenuPrimitive.Portal>
	);
}

export function DropdownMenuItem({
	className,
	...props
}: React.ComponentProps<typeof MenuPrimitive.Item>) {
	return <MenuPrimitive.Item className={cn(itemClass, className)} {...props} />;
}

export function DropdownMenuSubTrigger({
	className,
	...props
}: React.ComponentProps<typeof MenuPrimitive.SubTrigger>) {
	return (
		<MenuPrimitive.SubTrigger className={cn(itemClass, className)} {...props} />
	);
}

export function DropdownMenuSubContent({
	className,
	...props
}: React.ComponentProps<typeof MenuPrimitive.SubContent>) {
	return (
		<MenuPrimitive.Portal>
			<MenuPrimitive.SubContent
				className={cn(panelClass, className)}
				{...props}
			/>
		</MenuPrimitive.Portal>
	);
}

export function DropdownMenuSeparator() {
	return <MenuPrimitive.Separator className="-mx-1 my-1 h-px bg-border" />;
}
