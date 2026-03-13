import { SongsList } from "@/components/songs-list";
import { Separator } from "@/components/ui/separator";
import type { Song } from "@/types/entity";

interface SongSuggestionsProps {
	suggestions: Song[];
}

/**
 * Displays suggested songs section
 */
export function SongSuggestions({ suggestions }: SongSuggestionsProps) {
	if (suggestions.length === 0) {
		return null;
	}

	return (
		<>
			<Separator />
			<div className="space-y-4">
				<h2 className="text-2xl font-semibold">You Might Also Like</h2>
				<SongsList songs={suggestions} />
			</div>
		</>
	);
}
