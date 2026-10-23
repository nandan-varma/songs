import { Loader, LogIn, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { NavLabel } from "./nav-label";

export function NavigationAuthButton() {
	const router = useRouter();
	const { data: session, isPending } = authClient.useSession();

	if (isPending) {
		return (
			<Button
				variant="ghost"
				size="sm"
				aria-label="Loading..."
				className="focus:outline-none focus:ring-2 focus:ring-primary"
				disabled
			>
				<Loader className="h-4 w-4 animate-spin" aria-hidden="true" />
			</Button>
		);
	}

	if (session) {
		return (
			<Button
				variant="ghost"
				size="sm"
				onClick={() => authClient.signOut()}
				aria-label="Logout"
				className="focus:outline-none focus:ring-2 focus:ring-primary"
			>
				<LogOut className="h-4 w-4" aria-hidden="true" />
				<NavLabel>Logout</NavLabel>
			</Button>
		);
	}

	return (
		<Button
			variant="ghost"
			size="sm"
			onClick={() => {
				router.push("/auth");
			}}
			aria-label="Login"
			className="focus:outline-none focus:ring-2 focus:ring-primary"
		>
			<LogIn className="h-4 w-4" aria-hidden="true" />
			<NavLabel>Login</NavLabel>
		</Button>
	);
}
