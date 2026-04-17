import { Smartphone } from "lucide-react";
import { motion } from "motion/react";
import { DevMenu } from "@/components/dev/dev-menu";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/ui/use-pwa-install";
import { NavigationAuthButton } from "./NavigationAuthButton";

export function NavigationActions() {
	const { isInstallable, promptInstall } = usePWAInstall();

	return (
		<div className="flex items-center gap-1">
			{isInstallable && (
				<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
					<Button
						variant="outline"
						size="sm"
						onClick={promptInstall}
						className="shrink-0 focus:outline-none focus:ring-2 focus:ring-primary"
						aria-label="Install app"
					>
						<Smartphone className="h-4 w-4" aria-hidden="true" />
						<span className="ml-2 hidden whitespace-nowrap sm:inline">
							Install
						</span>
					</Button>
				</motion.div>
			)}

			<div className="w-[38px] shrink-0 sm:w-auto">
				<NavigationAuthButton />
			</div>

			{process.env.NODE_ENV === "development" && <DevMenu />}
		</div>
	);
}
