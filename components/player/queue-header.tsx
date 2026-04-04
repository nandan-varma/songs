"use client";

import { memo } from "react";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface QueueHeaderProps {
	queueCount: number;
}

/**
 * Queue header with title and count
 */
export const QueueHeader = memo(function QueueHeader({
	queueCount,
}: QueueHeaderProps) {
	return (
		<SheetHeader>
			<SheetTitle>Queue ({queueCount})</SheetTitle>
		</SheetHeader>
	);
});

QueueHeader.displayName = "QueueHeader";
