import { useQueryState } from "nuqs";
import { useOfflineStore } from "@/stores/offline-store";
import { useArtist } from "../data/queries";

export function useArtistFromQuery() {
	const [id] = useQueryState("id");
	const shouldEnableQuery = useOfflineStore((state) => state.shouldEnableQuery);

	return useArtist(id || "", {
		queryOptions: {
			enabled: !!id && shouldEnableQuery(),
			suspense: true,
		},
	});
}
