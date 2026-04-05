"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Database, RefreshCw, Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import {
	clearDownloadedSongsStorage,
	DOWNLOADED_SONGS_QUERY_KEY,
} from "@/lib/downloads/storage";
import { useAppStore } from "@/lib/store";
import { logError } from "@/lib/utils/logger";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";

export function DevMenu() {
	const queryClient = useQueryClient();
	const clearDownloadedSongs = useAppStore(
		(state) => state.clearDownloadedSongs,
	);
	const resetStore = useAppStore((state) => state.resetStore);
	const [isOpen, setIsOpen] = React.useState(false);

	const handleClearLocalStorage = () => {
		if (typeof window !== "undefined") {
			localStorage.clear();
			toast.success("Cleared localStorage");
		}
	};

	const handleClearCache = async () => {
		try {
			await clearDownloadedSongsStorage();
			clearDownloadedSongs();
			await queryClient.invalidateQueries({
				queryKey: DOWNLOADED_SONGS_QUERY_KEY,
			});
			toast.success("Cleared downloaded songs");
		} catch (error) {
			toast.error("Failed to clear cache");
			logError("DevMenu:clearCache", error);
		}
	};

	const handleClearAll = async () => {
		try {
			await clearDownloadedSongsStorage();
			clearDownloadedSongs();
			useAppStore.persist.clearStorage();
			resetStore();
			queryClient.clear();
			localStorage.clear();
			sessionStorage.clear();
			toast.success("Cleared all storage");
		} catch (error) {
			toast.error("Failed to clear storage");
			logError("DevMenu:clearAll", error);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="h-9 w-9"
					aria-label="Dev menu"
				>
					<Database className="h-4 w-4" />
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-md max-h-[90vh] flex flex-col">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Database className="h-5 w-5" />
						Developer Tools
					</DialogTitle>
					<DialogDescription>
						Clear storage and manage cache/service workers
					</DialogDescription>
				</DialogHeader>
				<ScrollArea className="flex-1 overflow-auto">
					<div className="space-y-4 p-1">
						{/* Clear Storage */}
						<Card>
							<CardHeader className="py-2">
								<CardTitle className="text-sm flex items-center gap-2">
									<Trash2 className="h-4 w-4" />
									Clear Storage
								</CardTitle>
							</CardHeader>
							<CardContent className="py-2 space-y-2">
								<Button
									variant="outline"
									size="sm"
									className="w-full justify-start"
									onClick={handleClearLocalStorage}
								>
									<Trash2 className="h-4 w-4 mr-2" />
									Clear localStorage
								</Button>
								<Button
									variant="outline"
									size="sm"
									className="w-full justify-start"
									onClick={handleClearCache}
								>
									<Database className="h-4 w-4 mr-2" />
									Clear Cache Manager
								</Button>
								<Button
									variant="destructive"
									size="sm"
									className="w-full justify-start"
									onClick={handleClearAll}
								>
									<RefreshCw className="h-4 w-4 mr-2" />
									Clear Everything
								</Button>
							</CardContent>
						</Card>

						{/* Quick Actions */}
						<Card>
							<CardHeader className="py-2">
								<CardTitle className="text-sm">Quick Actions</CardTitle>
							</CardHeader>
							<CardContent className="py-2 space-y-2">
								<Button
									variant="outline"
									size="sm"
									className="w-full justify-start"
									onClick={() => {
										navigator.serviceWorker?.getRegistrations().then((regs) => {
											regs.forEach((r) => {
												void r.unregister();
											});
											toast.success("Unregistered service workers");
										});
									}}
								>
									<RefreshCw className="h-4 w-4 mr-2" />
									Unregister Service Workers
								</Button>
								<Button
									variant="outline"
									size="sm"
									className="w-full justify-start"
									onClick={() => {
										if (typeof window !== "undefined") {
											window.location.reload();
										}
									}}
								>
									<RefreshCw className="h-4 w-4 mr-2" />
									Reload Page
								</Button>
							</CardContent>
						</Card>
					</div>
				</ScrollArea>
			</DialogContent>
		</Dialog>
	);
}
