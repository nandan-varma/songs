import { useQueryState } from "nuqs";
import { useOffline } from "@/contexts/offline-context";
import { useArtist } from "../queries";

export function useArtistFromQuery() {
	const [id] = useQueryState("id");
	const { shouldEnableQuery } = useOffline();

	return useArtist(id || "", {
		queryOptions: {
			enabled: !!id && shouldEnableQuery(),
			suspense: true,
		},
	});
}
