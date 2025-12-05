"use client";

import { HardDrive, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { musicDB } from "@/lib/db";

export function StorageInfo() {
	const [storageUsed, setStorageUsed] = useState(0);
	const [storageQuota, setStorageQuota] = useState(0);
	const [songCount, setSongCount] = useState(0);
	const [isLoading, setIsLoading] = useState(true);

	const loadStorageInfo = useCallback(async () => {
		try {
			setIsLoading(true);
			const used = await musicDB.getStorageSize();
			setStorageUsed(used);

			if ("storage" in navigator && "estimate" in navigator.storage) {
				const estimate = await navigator.storage.estimate();
				setStorageQuota(estimate.quota || 0);
			}

			const songs = await musicDB.getAllSongs();
			setSongCount(songs.length);
		} catch (error) {
			console.error("Failed to load storage info:", error);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		loadStorageInfo();

		// Refresh storage info every 10 seconds when tab is visible
		const interval = setInterval(() => {
			if (!document.hidden) {
				loadStorageInfo();
			}
		}, 10000);

		return () => clearInterval(interval);
	}, [loadStorageInfo]);

	const handleClearAll = async () => {
		if (
			!confirm(
				"Are you sure you want to clear all cached data? This will remove all downloaded songs and metadata.",
			)
		) {
			return;
		}

		try {
			await musicDB.clearAll();
			localStorage.clear();

			// Clear service worker caches
			if ("caches" in window) {
				const cacheNames = await caches.keys();
				await Promise.all(cacheNames.map((name) => caches.delete(name)));
			}

			toast.success("All cached data cleared");
			loadStorageInfo();
			window.location.reload();
		} catch (error) {
			console.error("Failed to clear cache:", error);
			toast.error("Failed to clear cache");
		}
	};

	const formatBytes = (bytes: number) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`;
	};

	const usagePercent =
		storageQuota > 0 ? (storageUsed / storageQuota) * 100 : 0;
	const getProgressColor = () => {
		if (usagePercent < 50) return "";
		if (usagePercent < 80) return "bg-yellow-500";
		return "bg-red-500";
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<HardDrive className="h-5 w-5" />
						Storage Usage
					</div>
					{isLoading && (
						<span className="text-xs text-muted-foreground">Loading...</span>
					)}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid grid-cols-2 gap-4">
					<div>
						<p className="text-xs text-muted-foreground mb-1">Songs Cached</p>
						<p className="text-2xl font-bold">{songCount}</p>
					</div>
					<div>
						<p className="text-xs text-muted-foreground mb-1">Storage Used</p>
						<p className="text-2xl font-bold">{formatBytes(storageUsed)}</p>
					</div>
				</div>

				<div>
					<div className="flex justify-between text-xs mb-2">
						<span className="text-muted-foreground">Available Storage</span>
						<span className="font-medium">
							{formatBytes(storageQuota - storageUsed)} remaining
						</span>
					</div>
					<Progress
						value={usagePercent}
						className={`h-2 ${getProgressColor()}`}
					/>
					<p className="text-xs text-muted-foreground mt-1">
						{usagePercent.toFixed(1)}% used of {formatBytes(storageQuota)} total
					</p>
				</div>

				<div className="pt-4 border-t">
					<div className="flex items-center justify-between">
						<p className="text-xs text-muted-foreground">
							Clear all cached data to free up space
						</p>
						<Button
							variant="destructive"
							size="sm"
							onClick={handleClearAll}
							disabled={songCount === 0}
						>
							<Trash2 className="h-4 w-4 mr-2" />
							Clear All
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
