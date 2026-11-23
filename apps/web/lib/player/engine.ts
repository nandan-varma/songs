import { toast } from "sonner";
import { useLibrary } from "@/lib/stores/library";
import { selectCurrentTrack, useClock, usePlayer } from "@/lib/stores/player";

const RESTART_THRESHOLD = 3;
const SEEK_STEP = 10;

let audio: HTMLAudioElement | null = null;

export function seekTo(time: number) {
	if (audio) audio.currentTime = time;
}

export function skipPrevious() {
	if (audio && audio.currentTime > RESTART_THRESHOLD) {
		audio.currentTime = 0;
		return;
	}
	usePlayer.getState().previous();
}

export function startEngine(): () => void {
	const element = new Audio();
	element.preload = "metadata";
	audio = element;

	const { getState } = usePlayer;
	const clock = useClock;

	const syncSession = () => {
		const track = selectCurrentTrack(getState());
		if (!track) {
			navigator.mediaSession.metadata = null;
			return;
		}
		navigator.mediaSession.metadata = new MediaMetadata({
			title: track.title,
			artist: track.artists.map((a) => a.name).join(", "),
			album: track.album?.name ?? "",
			artwork: [{ src: track.image }],
		});
	};

	const loadCurrent = () => {
		const track = selectCurrentTrack(getState());
		if (track) {
			element.src = track.audioUrl;
		} else {
			element.removeAttribute("src");
			element.load();
		}
		clock.setState({ currentTime: 0, duration: track?.duration ?? 0 });
		syncSession();
	};

	const unsubscribe = usePlayer.subscribe((state, previous) => {
		const track = selectCurrentTrack(state);
		if (track !== selectCurrentTrack(previous)) loadCurrent();
		element.volume = state.volume;
		if (state.playing && element.paused) {
			if (track && element.currentTime === 0) {
				useLibrary.getState().recordPlay(track);
			}
			element.play().catch(() => usePlayer.getState().pause());
		} else if (!state.playing && !element.paused) {
			element.pause();
		}
	});

	const on = <K extends keyof HTMLMediaElementEventMap>(
		type: K,
		listener: () => void,
	) => element.addEventListener(type, listener);

	on("timeupdate", () => {
		clock.setState({ currentTime: element.currentTime });
		if (Number.isFinite(element.duration)) {
			navigator.mediaSession.setPositionState({
				duration: element.duration,
				position: element.currentTime,
				playbackRate: element.playbackRate,
			});
		}
	});
	on("durationchange", () => {
		if (Number.isFinite(element.duration)) {
			clock.setState({ duration: element.duration });
		}
	});
	on("play", () => {
		if (!getState().playing) usePlayer.setState({ playing: true });
	});
	on("pause", () => {
		if (!element.ended && getState().playing)
			usePlayer.setState({ playing: false });
	});
	on("ended", () => {
		const { repeat, queue } = getState();
		if (repeat === "one" || (repeat === "all" && queue.length === 1)) {
			element.currentTime = 0;
			void element.play();
			return;
		}
		getState().next();
	});
	on("error", () => {
		toast.error("This track could not be played");
		usePlayer.getState().pause();
	});

	const session = navigator.mediaSession;
	session.setActionHandler("play", () => usePlayer.setState({ playing: true }));
	session.setActionHandler("pause", () => usePlayer.getState().pause());
	session.setActionHandler("previoustrack", skipPrevious);
	session.setActionHandler("nexttrack", () => getState().next());
	session.setActionHandler("seekto", ({ seekTime }) => {
		if (seekTime !== undefined) element.currentTime = seekTime;
	});
	session.setActionHandler("seekbackward", () => {
		element.currentTime = Math.max(0, element.currentTime - SEEK_STEP);
	});
	session.setActionHandler("seekforward", () => {
		element.currentTime += SEEK_STEP;
	});

	element.volume = getState().volume;
	loadCurrent();

	return () => {
		unsubscribe();
		element.pause();
		element.removeAttribute("src");
		audio = null;
	};
}
