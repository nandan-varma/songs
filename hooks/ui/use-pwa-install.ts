/**
 * PWA installation utilities
 * Manages the Web App Install Prompt and tracks installation state
 */

import { useEffect, useState } from "react";

/**
 * Event fired before the browser shows install prompt
 * Allows apps to defer the prompt for better UX
 */
interface BeforeInstallPromptEvent extends Event {
	/** Show the install prompt */
	prompt: () => Promise<void>;
	/** Promise that resolves when user accepts/dismisses the prompt */
	userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Hook to manage PWA installation
 * Detects if the app can be installed and triggers the install prompt
 *
 * @returns Object with installation state and methods
 * @returns {boolean} isInstallable - True if install prompt can be shown
 * @returns {boolean} isInstalled - True if app is already installed
 * @returns {() => Promise<boolean>} promptInstall - Trigger install prompt, returns true if accepted
 *
 * @example
 * const { isInstallable, promptInstall } = usePWAInstall();
 * return isInstallable && <button onClick={promptInstall}>Install App</button>;
 */
export function usePWAInstall() {
	const [deferredPrompt, setDeferredPrompt] =
		useState<BeforeInstallPromptEvent | null>(null);
	const [isInstallable, setIsInstallable] = useState(false);
	const [isInstalled, setIsInstalled] = useState(false);

	useEffect(() => {
		// Check if already installed (running in standalone mode)
		if (window.matchMedia("(display-mode: standalone)").matches) {
			setIsInstalled(true);
			return;
		}

		/**
		 * Handle the beforeinstallprompt event
		 * This is fired when the browser detects that the app can be installed
		 */
		const handleBeforeInstallPrompt = (e: Event) => {
			e.preventDefault();
			setDeferredPrompt(e as BeforeInstallPromptEvent);
			setIsInstallable(true);
		};

		/**
		 * Handle successful app installation
		 * Fired after the user completes the installation flow
		 */
		const handleAppInstalled = () => {
			setIsInstalled(true);
			setIsInstallable(false);
			setDeferredPrompt(null);
		};

		window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
		window.addEventListener("appinstalled", handleAppInstalled);

		return () => {
			window.removeEventListener(
				"beforeinstallprompt",
				handleBeforeInstallPrompt,
			);
			window.removeEventListener("appinstalled", handleAppInstalled);
		};
	}, []);

	/**
	 * Trigger the install prompt
	 * User will see the native install dialog
	 * @returns True if user accepted the install prompt
	 */
	const promptInstall = async (): Promise<boolean> => {
		if (!deferredPrompt) {
			return false;
		}

		deferredPrompt.prompt();
		const { outcome } = await deferredPrompt.userChoice;

		if (outcome === "accepted") {
			setDeferredPrompt(null);
			setIsInstallable(false);
			return true;
		}

		return false;
	};

	return {
		isInstallable,
		isInstalled,
		promptInstall,
	};
}
