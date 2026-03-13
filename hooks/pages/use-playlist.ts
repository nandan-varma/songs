import { useQueryState } from "nuqs";
import { useOffline } from "@/contexts/offline-context";
import { usePlaylist } from "../data/queries";

export function usePlaylistFromQuery() {
	const [id] = useQueryState("id");
	const { shouldEnableQuery } = useOffline();

	return usePlaylist(id || "", {
		enabled: !!id && shouldEnableQuery(),
		suspense: true,
	});
}
