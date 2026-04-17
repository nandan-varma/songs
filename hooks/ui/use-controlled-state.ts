"use client";

/**
 * useControlledState Hook
 * Manages state for controlled/uncontrolled patterns (dialog, popover, etc.)
 * Supports both controlled (via props) and uncontrolled (internal state) modes
 */

import { useCallback, useState } from "react";

interface UseControlledStateProps<T> {
	/** Controlled value (makes component controlled) */
	value?: T;
	/** Controlled defaultValue for uncontrolled mode */
	defaultValue?: T;
	/** Change handler */
	onChange?: (value: T) => void;
}

/**
 * Hook for managing controlled/uncontrolled state
 * @param props - Configuration including value, defaultValue, and onChange
 * @returns [state, setState] - Current state and setter function
 *
 * @example
 * // Uncontrolled mode
 * const [open, setOpen] = useControlledState({ defaultValue: false });
 *
 * // Controlled mode
 * const [open, setOpen] = useControlledState({ value: isOpen, onChange: setIsOpen });
 */
export function useControlledState<T>({
	value,
	defaultValue,
	onChange,
}: UseControlledStateProps<T>): [T, (newValue: T | ((prev: T) => T)) => void] {
	const isControlled = value !== undefined;

	// Fallback to defaultValue if neither value nor defaultValue are provided
	const initialValue = defaultValue ?? (value as T);

	const [internalState, setInternalState] = useState<T>(initialValue);

	const currentValue = isControlled ? value : internalState;

	const setState = useCallback(
		(newValue: T | ((prev: T) => T)) => {
			const nextValue =
				typeof newValue === "function"
					? (newValue as (prev: T) => T)(currentValue)
					: newValue;

			// Always update internal state (uncontrolled mode)
			if (!isControlled) {
				setInternalState(nextValue);
			}

			// Call onChange handler if provided
			onChange?.(nextValue);
		},
		[isControlled, currentValue, onChange],
	);

	return [currentValue, setState];
}
