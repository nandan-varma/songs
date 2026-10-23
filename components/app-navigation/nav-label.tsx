"use client";

import { AnimatePresence, motion } from "motion/react";
import { createContext, useContext } from "react";

const CondensedContext = createContext(false);

/** Tells every NavLabel below it whether the navbar is condensed (scrolled). */
export const NavCondensedProvider = CondensedContext.Provider;

/** Text beside a nav icon: shown on wider screens, and collapsed away once the navbar is condensed. */
export function NavLabel({ children }: { children: React.ReactNode }) {
	const condensed = useContext(CondensedContext);

	return (
		<AnimatePresence initial={false}>
			{!condensed && (
				<motion.span
					className="hidden overflow-hidden whitespace-nowrap sm:inline-block"
					initial={{ width: 0, opacity: 0, marginLeft: 0 }}
					animate={{ width: "auto", opacity: 1, marginLeft: 8 }}
					exit={{ width: 0, opacity: 0, marginLeft: 0 }}
					transition={{ duration: 0.2 }}
				>
					{children}
				</motion.span>
			)}
		</AnimatePresence>
	);
}
