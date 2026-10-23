"use client";

import { SearchIcon } from "@animateicons/react/lucide";
import { motion } from "motion/react";
import { memo, useCallback } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

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
	placeholder = "Search songs, albums, artists, or paste a JioSaavn link...",
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
			<motion.div
				className="relative flex-1"
				whileFocus={{ scale: 1.01 }}
				transition={{ duration: 0.2 }}
			>
				<SearchIcon
					size={16}
					className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
				/>
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
			</motion.div>
			<Button
				onClick={onSearch}
				size="icon"
				className="h-12 w-12"
				aria-label="Search"
				disabled={!value.trim()}
			>
				<SearchIcon size={16} />
			</Button>
		</div>
	);
});
