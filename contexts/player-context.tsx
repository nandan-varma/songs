'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { DetailedSong } from '@/lib/types';

interface PlayerContextType {
  // Current playback
  currentSong: DetailedSong | null;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  
  // Queue management
  queue: DetailedSong[];
  currentIndex: number;
  
  // Actions
  playSong: (song: DetailedSong, replaceQueue?: boolean) => void;
  playQueue: (songs: DetailedSong[], startIndex?: number) => void;
  addToQueue: (song: DetailedSong) => void;
  addMultipleToQueue: (songs: DetailedSong[]) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  
  togglePlayPause: () => void;
  playNext: () => void;
  playPrevious: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  
  // Audio element ref
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const [currentSong, setCurrentSong] = useState<DetailedSong | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queue, setQueue] = useState<DetailedSong[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Sync audio element with state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const playSong = useCallback((song: DetailedSong, replaceQueue = true) => {
    setCurrentSong(song);
    if (replaceQueue) {
      setQueue([song]);
      setCurrentIndex(0);
    }
    setIsPlaying(true);
  }, []);

  const playQueue = useCallback((songs: DetailedSong[], startIndex = 0) => {
    if (songs.length === 0) return;
    setQueue(songs);
    setCurrentIndex(startIndex);
    setCurrentSong(songs[startIndex]);
    setIsPlaying(true);
  }, []);

  const addToQueue = useCallback((song: DetailedSong) => {
    setQueue(prev => [...prev, song]);
  }, []);

  const addMultipleToQueue = useCallback((songs: DetailedSong[]) => {
    setQueue(prev => [...prev, ...songs]);
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueue(prev => {
      const newQueue = prev.filter((_, i) => i !== index);
      if (index < currentIndex) {
        setCurrentIndex(prev => prev - 1);
      } else if (index === currentIndex) {
        // If removing current song, play next
        if (newQueue.length > 0) {
          const newIndex = Math.min(currentIndex, newQueue.length - 1);
          setCurrentIndex(newIndex);
          setCurrentSong(newQueue[newIndex]);
        } else {
          setCurrentSong(null);
          setIsPlaying(false);
        }
      }
      return newQueue;
    });
  }, [currentIndex]);

  const clearQueue = useCallback(() => {
    setQueue([]);
    setCurrentIndex(0);
    setCurrentSong(null);
    setIsPlaying(false);
  }, []);

  const togglePlayPause = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(console.error);
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const playNext = useCallback(() => {
    if (queue.length === 0) return;
    const nextIndex = (currentIndex + 1) % queue.length;
    setCurrentIndex(nextIndex);
    setCurrentSong(queue[nextIndex]);
    setIsPlaying(true);
  }, [queue, currentIndex]);

  const playPrevious = useCallback(() => {
    if (queue.length === 0) return;
    
    // If more than 3 seconds into song, restart it
    if (currentTime > 3) {
      seekTo(0);
      return;
    }
    
    const prevIndex = currentIndex === 0 ? queue.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
    setCurrentSong(queue[prevIndex]);
    setIsPlaying(true);
  }, [queue, currentIndex, currentTime]);

  const seekTo = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  }, []);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => {
      playNext();
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [playNext]);

  const value: PlayerContextType = {
    currentSong,
    isPlaying,
    volume,
    currentTime,
    duration,
    queue,
    currentIndex,
    playSong,
    playQueue,
    addToQueue,
    addMultipleToQueue,
    removeFromQueue,
    clearQueue,
    togglePlayPause,
    playNext,
    playPrevious,
    seekTo,
    setVolume,
    audioRef,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
