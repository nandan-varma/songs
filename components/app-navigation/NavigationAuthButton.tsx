import { Loader, LogIn, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function NavigationAuthButton() {
	const router = useRouter();
	const { data: session, isPending } = authClient.useSession();

	if (isPending) {
		return (
			<Button
				variant="ghost"
				size="sm"
				aria-label="Loading..."
				className="w-full focus:outline-none focus:ring-2 focus:ring-primary"
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
				className="w-full focus:outline-none focus:ring-2 focus:ring-primary"
			>
				<LogOut className="h-4 w-4" aria-hidden="true" />
				<span className="ml-2 hidden whitespace-nowrap sm:inline">Logout</span>
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
			className="w-full focus:outline-none focus:ring-2 focus:ring-primary"
		>
			<LogIn className="h-4 w-4" aria-hidden="true" />
			<span className="ml-2 hidden whitespace-nowrap sm:inline">Login</span>
		</Button>
	);
}
