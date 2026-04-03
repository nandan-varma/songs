import { useQueryState } from "nuqs";
import { useOffline } from "@/hooks/cache";
import { useArtist } from "../data/queries";

export function useArtistFromQuery() {
	const [id] = useQueryState("id");
	const isOfflineMode = useOffline();

	return useArtist(id || "", {
		enabled: !!id && !isOfflineMode,
		suspense: true,
	});
}
