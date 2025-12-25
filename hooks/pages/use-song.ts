import { useQueryState } from "nuqs";
import { useOffline } from "@/contexts/offline-context";
import { useSong } from "../queries";

export function useSongFromQuery() {
	const [id] = useQueryState("id");
	const { shouldEnableQuery } = useOffline();

	return useSong(id || "", {
		enabled: !!id && shouldEnableQuery(),
		suspense: true,
	});
}
