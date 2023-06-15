import React from 'react';
import { Song } from '../components/song';

const ArtistPage = ({ artistData, handlePlay, handleAddToPlaylist }) => {
  return (
    <>
      {artistData !== null ? (
        <div className="album-box">
          <img
            className="background-art"
            src={artistData.image.find((img) => img.quality === "50x50").link}
            alt={artistData.name}
          />
          <h1>{artistData.name}</h1>
          <img
            className="bordered"
            src={artistData.image.find((img) => img.quality === "500x500").link}
            alt={artistData.name}
          />
          {/* <ul className="songs">
            {artistData.songs.map((song) => (
              <Song
                key={song.id}
                song={song}
                onPlay={handlePlay}
                onAddToPlaylist={handleAddToPlaylist}
              />
            ))}
          </ul> */}
          <p>Coming Soon</p>
        </div>
      ) : (
        <div>Loading Artist Data</div>
      )}
    </>
  );
};

export default ArtistPage;