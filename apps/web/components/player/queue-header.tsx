"use client";

import { Radio } from "lucide-react";
import { memo, useCallback } from "react";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Toggle } from "@/components/ui/toggle";
import { useIsRadioEnabled } from "@/hooks/use-store";
import { useAppStore } from "@/lib/store";

interface QueueHeaderProps {
	queueCount: number;
}

/**
 * Queue header with title, count, and the radio-mode toggle that keeps playback
 * going with algorithmic suggestions once the queue runs out.
 */
export const QueueHeader = memo(function QueueHeader({
	queueCount,
}: QueueHeaderProps) {
	const isRadioEnabled = useIsRadioEnabled();

	const handleToggleRadio = useCallback(() => {
		useAppStore.getState().toggleRadioMode();
	}, []);

	return (
		<SheetHeader className="flex-row items-center justify-between space-y-0">
			<SheetTitle>Queue ({queueCount})</SheetTitle>
			<Toggle
				size="sm"
				pressed={isRadioEnabled}
				onPressedChange={handleToggleRadio}
				aria-label="Toggle radio mode"
				className="gap-1.5 text-xs data-[state=on]:text-primary"
			>
				<Radio className="h-3.5 w-3.5" />
				Radio
			</Toggle>
		</SheetHeader>
	);
});

QueueHeader.displayName = "QueueHeader";
