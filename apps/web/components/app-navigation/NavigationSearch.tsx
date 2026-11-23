"use client";

import { SearchIcon } from "@animateicons/react/lucide";
import { X } from "lucide-react";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { isJioSaavnLink, resolveJioSaavnLink } from "@/lib/api";
import { logError } from "@/lib/utils/logger";

const SEARCH_DEBOUNCE_MS = 350;

/** Search box that lives in the navbar on every page; results render on the home route. */
export function NavigationSearch() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const urlQuery = searchParams.get("q") ?? "";
	const [draft, setDraft] = useState(urlQuery);
	const lastPushed = useRef(urlQuery);
	const inputRef = useRef<HTMLInputElement>(null);

	const showResults = useCallback(
		(query: string) => {
			lastPushed.current = query;
			const params = new URLSearchParams();
			const tab = searchParams.get("tab");
			if (query) params.set("q", query);
			if (query && tab && pathname === "/") params.set("tab", tab);
			const url = (query ? `/?${params}` : "/") as Route;
			if (pathname === "/") router.replace(url);
			else router.push(url);
		},
		[pathname, router, searchParams],
	);

	const openLink = useCallback(
		async (link: string) => {
			const toastId = toast.loading("Opening link...");
			try {
				const entity = await resolveJioSaavnLink(link);
				toast.dismiss(toastId);
				router.push(
					`/${entity.type}?id=${encodeURIComponent(entity.id)}` as Route,
				);
			} catch (error) {
				logError("NavigationSearch:resolveLink", error);
				toast.error(
					error instanceof Error ? error.message : "Could not open link",
					{ id: toastId },
				);
			}
		},
		[router],
	);

	// Search as you type.
	useEffect(() => {
		const next = draft.trim();
		if (next === urlQuery || isJioSaavnLink(next)) return;
		const timer = setTimeout(() => showResults(next), SEARCH_DEBOUNCE_MS);
		return () => clearTimeout(timer);
	}, [draft, urlQuery, showResults]);

	// Reflect URL changes made elsewhere (back/forward, links) in the input.
	useEffect(() => {
		if (urlQuery !== lastPushed.current) {
			lastPushed.current = urlQuery;
			setDraft(urlQuery);
		}
	}, [urlQuery]);

	// Press "/" anywhere to start searching.
	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			const target = event.target as HTMLElement;
			if (
				event.key !== "/" ||
				target.closest("input, textarea, [contenteditable]")
			)
				return;
			event.preventDefault();
			inputRef.current?.focus();
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, []);

	return (
		<search className="relative min-w-0 max-w-xl flex-1">
			<SearchIcon
				size={16}
				className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
			/>
			<Input
				ref={inputRef}
				type="search"
				value={draft}
				onChange={(event) => setDraft(event.target.value)}
				onKeyDown={(event) => {
					if (event.key !== "Enter") return;
					const next = draft.trim();
					if (isJioSaavnLink(next)) void openLink(next);
					else showResults(next);
				}}
				placeholder="Search or paste a link"
				aria-label="Search"
				autoComplete="off"
				spellCheck={false}
				className="h-10 rounded-full pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden"
			/>
			{draft && (
				<button
					type="button"
					onClick={() => {
						setDraft("");
						inputRef.current?.focus();
					}}
					aria-label="Clear search"
					className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
				>
					<X className="h-4 w-4" />
				</button>
			)}
		</search>
	);
}
