import { useQueryState } from "nuqs";
import { useOffline } from "@/hooks/cache";
import { useAlbum } from "../data/queries";

export function useAlbumFromQuery() {
	const [id] = useQueryState("id");
	const isOfflineMode = useOffline();

	return useAlbum(id || "", {
		enabled: !!id && !isOfflineMode,
		suspense: true,
	});
}
