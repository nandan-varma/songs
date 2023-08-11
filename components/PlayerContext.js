import React, { createContext, useState, useContext } from 'react';

const PlayerContext = createContext();

export const usePlayerContext = () => useContext(PlayerContext);

export const PlayerProvider = ({ children }) => {
  const [playlist, setPlaylist] = useState([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);

  const handlePlay = (item) => {
    setPlaylist([item]);
    setCurrentSongIndex(0);
  };
  
  const handleAddToPlaylist = (item) => {
    setPlaylist((prevPlaylist) => [...prevPlaylist, item]);
    console.log(playlist);
  };

  const handleNextSong = () => {
    setCurrentSongIndex((prevIndex) => (prevIndex + 1) % playlist.length);
  };

  const handlePrevSong = () => {
    if (currentSongIndex > 0) {
      setCurrentSongIndex((prevIndex) => (prevIndex - 1) % playlist.length);
    }
  };

  // Add other player-related states and functions here

  return (
    <PlayerContext.Provider value={{ playlist, setPlaylist, currentSongIndex, setCurrentSongIndex, handlePlay, handleAddToPlaylist, handlePrevSong, handleNextSong }}>
      {children}
    </PlayerContext.Provider>
  );
};
