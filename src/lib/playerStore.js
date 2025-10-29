import { writable } from "svelte/store";

export const queue = writable([]);
export const currentIndex = writable(-1);
export const currentSong = writable(null);
export const isPlaying = writable(false);
export const volume = writable(0.5);
export const progress = writable(0);
export const duration = writable(0);
