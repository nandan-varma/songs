"use client";

import { useEffect, useRef } from "react";

export function InfiniteSentinel({ onVisible }: { onVisible: () => void }) {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const node = ref.current;
		if (!node) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry?.isIntersecting) onVisible();
			},
			{ rootMargin: "400px" },
		);
		observer.observe(node);
		return () => observer.disconnect();
	}, [onVisible]);

	return <div ref={ref} aria-hidden className="h-px" />;
}
