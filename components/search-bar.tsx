"use client";

import { Search } from "lucide-react";
import { memo, useCallback } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

// ============================================================================
// TYPES
// ============================================================================

interface SearchBarProps {
	value: string;
	onChange: (value: string) => void;
	onSearch: () => void;
	placeholder?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Optimized search bar with memoization and stable event handlers
 * Prevents unnecessary re-renders when parent components update
 */
export const SearchBar = memo(function SearchBar({
	value,
	onChange,
	onSearch,
	placeholder = "Search for songs, albums, or artists...",
}: SearchBarProps) {
	// Stable event handlers using useCallback
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "Enter") {
				onSearch();
			}
		},
		[onSearch],
	);

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			onChange(e.target.value);
		},
		[onChange],
	);

	return (
		<div className="flex gap-2 w-full max-w-2xl">
			<div className="relative flex-1">
				<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
				<Input
					type="text"
					value={value}
					onChange={handleInputChange}
					onKeyDown={handleKeyDown}
					placeholder={placeholder}
					className="pl-10 h-12 text-base"
					autoComplete="off"
					spellCheck="false"
				/>
			</div>
			<Button
				onClick={onSearch}
				size="icon"
				className="h-12 w-12"
				aria-label="Search"
				disabled={!value.trim()}
			>
				<Search className="h-4 w-4" />
			</Button>
		</div>
	);
});
