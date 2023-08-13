import React, { createContext, useState, useContext } from 'react';

const PlayerContext = createContext();

export const usePlayerContext = () => useContext(PlayerContext);

export const PlayerProvider = ({ children }) => {
  const [playlist, setPlaylist] = useState([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);

  const handlePlay = (item) => {
    console.log(playlist);
    setPlaylist([item]);
    setCurrentSongIndex(0);
  };

  const handleRemovePlaylist = (item) => {
    setPlaylist((prevPlaylist) => prevPlaylist.filter((song) => song.id !== item.id));
  };

  const handleAddToPlaylist = (item) => {
    setPlaylist((prevPlaylist) => [...prevPlaylist, item]);
  };

  const handleNextSong = () => {
    setCurrentSongIndex((prevIndex) => (prevIndex + 1) % playlist.length);
    console.log("future is now");
  };

  const handlePrevSong = () => {
    if (currentSongIndex > 0) {
      setCurrentSongIndex((prevIndex) => (prevIndex - 1) % playlist.length);
    }
  };

  async function getDownloadUrl(id) {
    try {
        const response = await fetch(`https://saavn-api.nandanvarma.com/songs?id=${id}`);
        const data = await response.json();
        const url = data.data[0].downloadUrl[4].link;
        return url;
    } catch (error) {
        console.error("Error fetching download URL:", error);
        return null;
    }
}

  return (
    <PlayerContext.Provider value={{ playlist, setPlaylist, currentSongIndex, setCurrentSongIndex, handlePlay, handleAddToPlaylist, handleRemovePlaylist, handlePrevSong, handleNextSong, getDownloadUrl }}>
      {children}
    </PlayerContext.Provider>
  );
};
