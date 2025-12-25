import { useQueryState } from "nuqs";
import { useOffline } from "@/contexts/offline-context";
import { useAlbum } from "../queries";

export function useAlbumFromQuery() {
	const [id] = useQueryState("id");
	const { shouldEnableQuery } = useOffline();

	return useAlbum(id || "", {
		enabled: !!id && shouldEnableQuery(),
		suspense: true,
	});
}
