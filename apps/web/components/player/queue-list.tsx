"use client";

import { X } from "lucide-react";
import { Cover } from "@/components/cover";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/lib/stores/player";
import { cn } from "@/lib/utils";

export function QueueList() {
	const queue = usePlayer((s) => s.queue);
	const index = usePlayer((s) => s.index);
	const { jumpTo, removeAt, clear } = usePlayer.getState();

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<h3 className="font-medium">Queue ({queue.length})</h3>
				<Button variant="ghost" size="sm" onClick={clear}>
					Clear
				</Button>
			</div>
			<ul>
				{queue.map((track, i) => (
					<li
						// biome-ignore lint/suspicious/noArrayIndexKey: the same song can be queued twice
						key={`${track.id}:${i}`}
						className="flex items-center gap-1"
					>
						<button
							type="button"
							onClick={() => jumpTo(i)}
							className="flex min-w-0 flex-1 items-center gap-3 py-1.5 text-left"
						>
							<Cover
								src={track.image}
								alt=""
								sizes="40px"
								className="size-10 shrink-0"
							/>
							<span className="min-w-0">
								<span
									className={cn(
										"block truncate text-sm font-medium",
										i === index && "text-primary",
									)}
								>
									{track.title}
								</span>
								<span className="block truncate text-xs text-muted-foreground">
									{track.artists.map((a) => a.name).join(", ")}
								</span>
							</span>
						</button>
						<Button
							variant="ghost"
							size="icon"
							aria-label={`Remove ${track.title} from queue`}
							onClick={() => removeAt(i)}
						>
							<X />
						</Button>
					</li>
				))}
			</ul>
		</div>
	);
}
