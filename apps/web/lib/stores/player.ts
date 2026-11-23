import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Track } from "@/lib/models";

type RepeatMode = "off" | "all" | "one";

interface PlayerState {
	queue: Track[];
	index: number;
	playing: boolean;
	repeat: RepeatMode;
	volume: number;
	/** Replaces the queue and starts playing at `startIndex`. */
	play: (tracks: Track[], startIndex?: number) => void;
	playNext: (track: Track) => void;
	enqueue: (track: Track) => void;
	removeAt: (index: number) => void;
	jumpTo: (index: number) => void;
	clear: () => void;
	toggle: () => void;
	pause: () => void;
	next: () => void;
	previous: () => void;
	cycleRepeat: () => void;
	setVolume: (volume: number) => void;
}

const REPEAT_ORDER: RepeatMode[] = ["off", "all", "one"];

export const usePlayer = create<PlayerState>()(
	persist(
		(set, get) => ({
			queue: [],
			index: 0,
			playing: false,
			repeat: "off",
			volume: 0.8,
			play: (tracks, startIndex = 0) =>
				set({ queue: tracks, index: startIndex, playing: tracks.length > 0 }),
			playNext: (track) =>
				set(({ queue, index }) =>
					queue.length === 0
						? { queue: [track], index: 0, playing: true }
						: { queue: queue.toSpliced(index + 1, 0, track) },
				),
			enqueue: (track) =>
				set(({ queue }) =>
					queue.length === 0
						? { queue: [track], index: 0, playing: true }
						: { queue: [...queue, track] },
				),
			removeAt: (target) =>
				set(({ queue, index }) => {
					const remaining = queue.toSpliced(target, 1);
					if (remaining.length === 0) {
						return { queue: remaining, index: 0, playing: false };
					}
					if (target < index) return { queue: remaining, index: index - 1 };
					return {
						queue: remaining,
						index: Math.min(index, remaining.length - 1),
					};
				}),
			jumpTo: (index) => set({ index, playing: true }),
			clear: () => set({ queue: [], index: 0, playing: false }),
			toggle: () =>
				set(({ queue, playing }) => ({
					playing: queue.length > 0 && !playing,
				})),
			pause: () => set({ playing: false }),
			next: () => {
				const { queue, index, repeat } = get();
				if (index + 1 < queue.length) return set({ index: index + 1 });
				if (repeat === "all") return set({ index: 0 });
				set({ playing: false });
			},
			previous: () => set(({ index }) => ({ index: Math.max(0, index - 1) })),
			cycleRepeat: () =>
				set(({ repeat }) => ({
					repeat: REPEAT_ORDER[(REPEAT_ORDER.indexOf(repeat) + 1) % 3] ?? "off",
				})),
			setVolume: (volume) => set({ volume }),
		}),
		{
			name: "songs:player",
			version: 1,
			skipHydration: true,
			partialize: ({ queue, index, repeat, volume }) => ({
				queue,
				index,
				repeat,
				volume,
			}),
		},
	),
);

export const selectCurrentTrack = (state: PlayerState): Track | undefined =>
	state.queue[state.index];

/** Playback position, kept apart from the persisted store because it ticks several times a second. */
interface ClockState {
	currentTime: number;
	duration: number;
}

export const useClock = create<ClockState>(() => ({
	currentTime: 0,
	duration: 0,
}));
