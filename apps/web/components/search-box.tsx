"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { queryParam } from "@/lib/search-params";
import { useSearchHistory } from "@/lib/stores/search";

export const SEARCH_INPUT_ID = "search-input";
const SEARCH_PATH = "/search";

function isTyping(target: EventTarget | null) {
	return (
		target instanceof HTMLElement &&
		(target.isContentEditable ||
			/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
	);
}

function resultItems() {
	return [...document.querySelectorAll<HTMLElement>("[data-result]")];
}

function clearActive() {
	for (const item of resultItems()) delete item.dataset.active;
}

function moveActive(step: 1 | -1) {
	const items = resultItems();
	if (items.length === 0) return;
	const current = items.findIndex((item) => item.dataset.active === "true");
	clearActive();
	const next = Math.min(Math.max(current + step, 0), items.length - 1);
	const item = items[next];
	if (!item) return;
	item.dataset.active = "true";
	item.scrollIntoView({ block: "nearest" });
}

function activeItem() {
	return resultItems().find((item) => item.dataset.active === "true");
}

export function SearchBox() {
	const router = useRouter();
	const pathname = usePathname();
	const onSearchPage = pathname === SEARCH_PATH;
	const [query, setQuery] = useQueryState("q", queryParam);
	const remember = useSearchHistory((s) => s.remember);
	const inputRef = useRef<HTMLInputElement>(null);
	const [draft, setDraft] = useState("");
	const value = onSearchPage ? query : draft;

	useEffect(() => {
		if (onSearchPage) setDraft("");
	}, [onSearchPage]);

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			const shortcut =
				(event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
			const slash = event.key === "/" && !isTyping(event.target);
			if (!shortcut && !slash) return;
			event.preventDefault();
			inputRef.current?.focus();
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, []);

	const onChange = (next: string) => {
		clearActive();
		if (onSearchPage) void setQuery(next || null);
		else {
			const navigate = draft ? router.replace : router.push;
			setDraft(next);
			navigate(`${SEARCH_PATH}?${new URLSearchParams({ q: next })}`);
		}
	};

	const onKeyDown = (event: React.KeyboardEvent) => {
		switch (event.key) {
			case "ArrowDown":
			case "ArrowUp":
				event.preventDefault();
				moveActive(event.key === "ArrowDown" ? 1 : -1);
				break;
			case "Enter": {
				const item = activeItem();
				if (item) item.click();
				else remember(value);
				break;
			}
			case "Escape":
				if (value) void setQuery(null);
				else inputRef.current?.blur();
				break;
		}
	};

	return (
		<search className="relative min-w-0 flex-1 md:max-w-md">
			<Search
				aria-hidden
				className="pointer-events-none absolute top-3 left-3 size-5 text-muted-foreground"
			/>
			<Input
				ref={inputRef}
				id={SEARCH_INPUT_ID}
				type="text"
				inputMode="search"
				enterKeyHint="search"
				autoComplete="off"
				spellCheck={false}
				aria-label="Search songs, albums, artists and playlists"
				placeholder="Search"
				value={value}
				className="pr-11 pl-10"
				onFocus={() => {
					if (!onSearchPage) router.push(SEARCH_PATH);
				}}
				onChange={(event) => onChange(event.target.value)}
				onKeyDown={onKeyDown}
			/>
			{value && (
				<Button
					variant="ghost"
					size="icon"
					aria-label="Clear search"
					className="absolute top-0 right-0"
					onClick={() => {
						void setQuery(null);
						inputRef.current?.focus();
					}}
				>
					<X />
				</Button>
			)}
		</search>
	);
}
