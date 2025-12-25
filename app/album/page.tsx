import { ErrorBoundary } from "@/components/error-boundary";
import { Client } from "./client";

export default function Page() {
	return (
		<ErrorBoundary>
			<Client />
		</ErrorBoundary>
	);
}
