"use client";

import { type Transition, useReducedMotion } from "motion/react";

export function useAnimationPreferences() {
	const reduceMotion = useReducedMotion();

	return {
		reduceMotion,
		getTransition: (
			normal: Transition,
			reduced: Transition = { duration: 0 },
		) => (reduceMotion ? reduced : normal),
	};
}
