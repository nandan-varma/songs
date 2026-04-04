import { useQueryState } from "nuqs";
import { useOffline } from "@/hooks/cache";
import { usePlaylist } from "../data/queries";

export function usePlaylistFromQuery() {
	const [id] = useQueryState("id");
	const isOfflineMode = useOffline();

	return usePlaylist(id || "", {
		enabled: !!id && !isOfflineMode,
	});
}
