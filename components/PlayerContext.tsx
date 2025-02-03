import { api_link } from '../lib/api';
import React, { createContext, useState, useContext, ReactNode } from 'react';

interface Song {
  id: string;
  [key: string]: any;
}

interface PlayerContextType {
  playlist: Song[];
  setPlaylist: React.Dispatch<React.SetStateAction<Song[]>>;
  currentSongIndex: number;
  setCurrentSongIndex: React.Dispatch<React.SetStateAction<number>>;
  currentImage: string;
  SetCurrentImage: React.Dispatch<React.SetStateAction<string>>;
  handlePlay: (item: Song) => void;
  handleAddToPlaylist: (item: Song) => void;
  handleRemovePlaylist: (item: Song) => void;
  handlePrevSong: () => void;
  handleNextSong: () => void;
  getDownloadUrl: (id: string) => Promise<string | null>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const usePlayerContext = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayerContext must be used within a PlayerProvider');
  }
  return context;
};

interface PlayerProviderProps {
  children: ReactNode;
}

export const PlayerProvider: React.FC<PlayerProviderProps> = ({ children }) => {
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [currentImage, SetCurrentImage] = useState('');

  const handlePlay = (item: Song) => {
    setPlaylist([item]);
    setCurrentSongIndex(0);
  };

  const handleRemovePlaylist = (item: Song) => {
    setPlaylist((prevPlaylist) => prevPlaylist.filter((song) => song.id !== item.id));
  };

  const handleAddToPlaylist = (item: Song) => {
    if (!playlist.includes(item)) {
      setPlaylist((prevPlaylist) => [...prevPlaylist, item]);
    }
  };

  const handleNextSong = () => {
    setCurrentSongIndex((prevIndex) => (prevIndex + 1) % playlist.length);
  };

  const handlePrevSong = () => {
    if (currentSongIndex > 0) {
      setCurrentSongIndex((prevIndex) => (prevIndex - 1) % playlist.length);
    }
  };

  const getDownloadUrl = async (id: string): Promise<string | null> => {
    try {
      const response = await fetch(`${api_link}/songs?id=${id}`);
      const data = await response.json();
      const url = data.data[0].downloadUrl[4].link;
      return url;
    } catch (error) {
      console.error("Error fetching download URL:", error);
      return null;
    }
  };

  return (
    <PlayerContext.Provider value={{ playlist, setPlaylist, currentSongIndex, setCurrentSongIndex, currentImage, SetCurrentImage, handlePlay, handleAddToPlaylist, handleRemovePlaylist, handlePrevSong, handleNextSong, getDownloadUrl }}>
      {children}
    </PlayerContext.Provider>
  );
};
