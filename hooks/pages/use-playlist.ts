import { useQueryState } from "nuqs";
import { useOfflineStore } from "@/stores/offline-store";
import { usePlaylist } from "../data/queries";

export function usePlaylistFromQuery() {
	const [id] = useQueryState("id");
	const shouldEnableQuery = useOfflineStore((state) => state.shouldEnableQuery);

	return usePlaylist(id || "", {
		enabled: !!id && shouldEnableQuery(),
		suspense: true,
	});
}
