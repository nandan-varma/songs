import React from 'react';
import { Song } from '../components/song';

const AlbumPage = ({ albumData, handlePlay, handleAddToPlaylist }) => {
  return (
    <>
      {albumData !== null ? (
        <div className="album-box">
          <img
            className="background-art"
            src={albumData.image.find((img) => img.quality === "50x50").link}
            alt={albumData.name}
          />
          <h1>{albumData.name}</h1>
          <img
            className="bordered"
            src={albumData.image.find((img) => img.quality === "500x500").link}
            alt={albumData.name}
          />
          <ul className="songs">
            {albumData.songs.map((song) => (
              <Song
                key={song.id}
                song={song}
                onPlay={handlePlay}
                onAddToPlaylist={handleAddToPlaylist}
              />
            ))}
          </ul>
        </div>
      ) : (
        <div>Loading Album Data</div>
      )}
    </>
  );
};

export default AlbumPage;