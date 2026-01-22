"use client";

import {
	Database,
	Download,
	HardDrive,
	RefreshCw,
	Trash2,
	Upload,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import type { ExportData } from "@/lib/storage/config";
import { storage } from "@/lib/storage/core";
import {
	bustCache,
	exportForBackup,
	getStorageEstimate,
	getStorageVersion,
	importFromBackup,
	needsMigration,
} from "@/lib/storage/migrate";
import { BackupDataSchema } from "@/lib/validations/backup";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { ScrollArea } from "../ui/scroll-area";

export function DevMenu() {
	const [isOpen, setIsOpen] = React.useState(false);
	const [storageUsage, setStorageUsage] = React.useState<{
		usage: number;
		quota: number;
		percentUsed: number;
	} | null>(null);
	const [importData, setImportData] = React.useState("");
	const [isImporting, setIsImporting] = React.useState(false);

	React.useEffect(() => {
		if (isOpen) {
			getStorageEstimate().then(setStorageUsage);
		}
	}, [isOpen]);

	const handleClearLocalStorage = () => {
		if (typeof window !== "undefined") {
			localStorage.clear();
			toast.success("Cleared localStorage");
		}
	};

	const handleClearIndexedDB = async () => {
		await storage.clearAll();
		toast.success("Cleared IndexedDB");
	};

	const handleCacheBust = async () => {
		await bustCache();
		toast.success("Cache busted! Refresh the page.");
	};

	const handleExport = async () => {
		try {
			const data = await exportForBackup();
			const blob = new Blob([JSON.stringify(data, null, 2)], {
				type: "application/json",
			});
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `music-app-backup-${new Date().toISOString().split("T")[0]}.json`;
			a.click();
			URL.revokeObjectURL(url);
			toast.success("Exported backup");
		} catch (error) {
			console.error("Export failed:", error);
			toast.error(
				`Failed to export: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	};

	const handleImport = async () => {
		if (!importData.trim()) return;

		setIsImporting(true);
		try {
			const rawData = JSON.parse(importData);

			// Validate the backup data structure
			const validatedData = BackupDataSchema.parse(rawData);

			// Build ExportData from validated backup data
			const exportData: ExportData = {
				version: validatedData.version,
				timestamp: validatedData.timestamp,
				localStorage: (validatedData.localStorage || {}) as Record<
					string,
					import("@/lib/storage/config").JsonValue
				>,
				indexedDB: (validatedData.indexedDB || {}) as Record<
					string,
					Record<string, import("@/lib/storage/config").JsonValue[]>
				>,
			};

			await importFromBackup(exportData);
			toast.success("Imported successfully! Refresh the page.");
			setImportData("");
		} catch (error) {
			console.error("Import error:", error);
			if (error instanceof Error) {
				toast.error(`Failed to import: ${error.message}`);
			} else {
				toast.error("Failed to import. Check console for details.");
			}
		} finally {
			setIsImporting(false);
		}
	};

	const formatBytes = (bytes: number) => {
		if (bytes === 0) return "0 B";
		const k = 1024;
		const sizes = ["B", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
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
					<HardDrive className="h-4 w-4" />
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-md max-h-[90vh] flex flex-col">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<HardDrive className="h-5 w-5" />
						Developer Tools
					</DialogTitle>
				</DialogHeader>
				<ScrollArea className="flex-1 overflow-auto">
					<div className="space-y-4 p-1">
						{/* Storage Status */}
						<Card>
							<CardHeader className="py-2">
								<CardTitle className="text-sm flex items-center gap-2">
									<Database className="h-4 w-4" />
									Storage Status
								</CardTitle>
							</CardHeader>
							<CardContent className="py-2 text-sm space-y-1">
								<div className="flex justify-between">
									<span>Version:</span>
									<span className="font-mono">{getStorageVersion()}</span>
								</div>
								<div className="flex justify-between">
									<span>Needs Migration:</span>
									<span
										className={
											needsMigration() ? "text-orange-500" : "text-green-500"
										}
									>
										{needsMigration() ? "Yes" : "No"}
									</span>
								</div>
								{storageUsage && (
									<>
										<div className="flex justify-between">
											<span>Used:</span>
											<span>{formatBytes(storageUsage.usage)}</span>
										</div>
										<div className="flex justify-between">
											<span>Quota:</span>
											<span>{formatBytes(storageUsage.quota)}</span>
										</div>
										<div className="w-full bg-muted rounded-full h-2 mt-2">
											<div
												className="bg-primary h-2 rounded-full transition-all"
												style={{ width: `${storageUsage.percentUsed}%` }}
											/>
										</div>
										<p className="text-xs text-muted-foreground text-center">
											{storageUsage.percentUsed.toFixed(2)}% used
										</p>
									</>
								)}
							</CardContent>
						</Card>

						{/* Clear Options */}
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
									Clear localStorage Only
								</Button>
								<Button
									variant="outline"
									size="sm"
									className="w-full justify-start"
									onClick={handleClearIndexedDB}
								>
									<Database className="h-4 w-4 mr-2" />
									Clear IndexedDB Only
								</Button>
								<Button
									variant="destructive"
									size="sm"
									className="w-full justify-start"
									onClick={handleCacheBust}
								>
									<RefreshCw className="h-4 w-4 mr-2" />
									Cache Bust (Clear Everything)
								</Button>
							</CardContent>
						</Card>

						{/* Backup Options */}
						<Card>
							<CardHeader className="py-2">
								<CardTitle className="text-sm flex items-center gap-2">
									<Download className="h-4 w-4" />
									Backup / Restore
								</CardTitle>
							</CardHeader>
							<CardContent className="py-2 space-y-2">
								<Button
									variant="outline"
									size="sm"
									className="w-full justify-start"
									onClick={handleExport}
								>
									<Download className="h-4 w-4 mr-2" />
									Export Backup
								</Button>
								<div className="space-y-2">
									<Label className="text-xs">Import Backup</Label>
									<Input
										placeholder="Paste backup JSON here..."
										value={importData}
										onChange={(e) => setImportData(e.target.value)}
										className="text-xs font-mono"
									/>
									<Button
										variant="outline"
										size="sm"
										className="w-full justify-start"
										onClick={handleImport}
										disabled={!importData.trim() || isImporting}
									>
										<Upload className="h-4 w-4 mr-2" />
										{isImporting ? "Importing..." : "Import Backup"}
									</Button>
								</div>
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
