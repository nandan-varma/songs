import { useQueryState } from "nuqs";
import { useOfflineStore } from "@/stores/offline-store";
import { useAlbum } from "../data/queries";

export function useAlbumFromQuery() {
	const [id] = useQueryState("id");
	const shouldEnableQuery = useOfflineStore((state) => state.shouldEnableQuery);

	return useAlbum(id || "", {
		enabled: !!id && shouldEnableQuery(),
		suspense: true,
	});
}
