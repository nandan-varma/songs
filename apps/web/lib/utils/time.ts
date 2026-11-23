/**
 * Time formatting utilities for audio player
 */

/**
 * Formats seconds into MM:SS format
 * @param seconds - Time in seconds
 * @returns Formatted time string (e.g., "3:45")
 */
export function formatTime(seconds: number): string {
	if (Number.isNaN(seconds) || !Number.isFinite(seconds)) {
		return "0:00";
	}
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Formats duration for display (handles 0 and infinity cases)
 * @param duration - Duration in seconds
 * @returns Formatted duration string
 */
export function formatDuration(duration: number): string {
	if (!duration || Number.isNaN(duration) || !Number.isFinite(duration)) {
		return "0:00";
	}
	return formatTime(duration);
}

/**
 * Converts percentage to volume value (0-1)
 * @param percent - Percentage value (0-100)
 * @returns Volume value (0-1)
 */
export function percentToVolume(percent: number): number {
	return Math.max(0, Math.min(1, percent / 100));
}

/**
 * Converts volume value (0-1) to percentage
 * @param volume - Volume value (0-1)
 * @returns Percentage value (0-100)
 */
export function volumeToPercent(volume: number): number {
	return Math.round(volume * 100);
}

/**
 * Clamps a time value to valid audio range
 * @param time - Requested time in seconds
 * @param duration - Maximum duration in seconds
 * @returns Clamped time value
 */
export function clampTime(time: number, duration: number): number {
	if (!duration || Number.isNaN(duration) || !Number.isFinite(duration)) {
		return Math.max(0, time);
	}
	return Math.max(0, Math.min(duration, time));
}

/**
 * Calculates progress percentage from current time and duration
 * @param currentTime - Current playback position in seconds
 * @param duration - Total duration in seconds
 * @returns Progress percentage (0-100)
 */
export function calculateProgress(
	currentTime: number,
	duration: number,
): number {
	if (!duration || Number.isNaN(duration) || !Number.isFinite(duration)) {
		return 0;
	}
	return Math.max(0, Math.min(100, (currentTime / duration) * 100));
}

/**
 * Converts progress percentage to time value
 * @param progress - Progress percentage (0-100)
 * @param duration - Total duration in seconds
 * @returns Time value in seconds
 */
export function progressToTime(progress: number, duration: number): number {
	if (!duration || Number.isNaN(duration) || !Number.isFinite(duration)) {
		return 0;
	}
	return clampTime((progress / 100) * duration, duration);
}
