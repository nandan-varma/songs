import { useQueryState } from "nuqs";
import { useOfflineStore } from "@/stores/offline-store";
import { useSong } from "../data/queries";

export function useSongFromQuery() {
	const [id] = useQueryState("id");
	const shouldEnableQuery = useOfflineStore((state) => state.shouldEnableQuery);

	return useSong(id || "", {
		enabled: !!id && shouldEnableQuery(),
		suspense: true,
	});
}
