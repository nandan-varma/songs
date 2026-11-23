import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadHref } from "@/lib/download";
import type { Track } from "@/lib/models";

export function DownloadButton({ track }: { track: Track }) {
	return (
		<Button variant="ghost" size="icon" asChild>
			<a
				href={downloadHref(track)}
				download
				aria-label={`Download ${track.title}`}
			>
				<Download />
			</a>
		</Button>
	);
}
