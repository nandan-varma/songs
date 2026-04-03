import { useQueryState } from "nuqs";
import { useOffline } from "@/hooks/cache";
import { useSong } from "../data/queries";

export function useSongFromQuery() {
	const [id] = useQueryState("id");
	const isOfflineMode = useOffline();

	return useSong(id || "", {
		enabled: !!id && !isOfflineMode,
		suspense: true,
	});
}
