import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPlus, faDownload } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

const Song = ({ song, onPlay, onAddToPlaylist }) => {
  return (
    <li className='song bordered' key={song.id}>
      <img className='song-art bordered' src={song.image.find(img => img.quality === '500x500').link} alt={song.name} />
      <h3>{song.name}</h3>
      {/* <h4>{song.primaryArtists}</h4> */}
      <div className='song-controls'>
        <FontAwesomeIcon onClick={() => onPlay(song)} icon={faPlay} />
        <FontAwesomeIcon onClick={() => onAddToPlaylist(song)} icon={faPlus} />
        <FontAwesomeIcon onClick={async () => {
      const response = await fetch(song.downloadUrl[4].link);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = song.name;
      link.click();
      URL.revokeObjectURL(blobUrl);
    }} icon={faDownload} />
      </div>
    </li>
  );
};


const Album = ({ album, handleAlbumClick }) => {
  return (
    <li className='album bordered' key={album.id} onClick={() => { handleAlbumClick(album.id) }}>
      <img className='album-art bordered' src={album.image.find(img => img.quality === '500x500').link} alt={album.name} />
      <h3>{album.name}</h3>
      {/* <h4>{song.primaryArtists}</h4> */}
      {/* <div className='album-controls'> */}
      {/* <FontAwesomeIcon onClick={() => onPlay(album)} icon={faPlay} /> */}
      {/* </div> */}
    </li>
  );
};

const Playlist = ({ playlist, currentSongIndex }) => {
  const [expanded, setExpanded] = useState(false);

  const handleToggleExpand = () => {
    setExpanded(prevExpanded => !prevExpanded);
  };

  return (
    <div className={`playlist ${expanded ? 'expanded' : ''}`} onClick={handleToggleExpand}>
      <div className='current-song'>
        <h3>{playlist[currentSongIndex].name}</h3>
        <h4>{playlist[currentSongIndex].primaryArtists}</h4>
      </div>
      {expanded && (
        <ul className='playlist-songs'>
          {playlist.map((song, index) => (
            <li className={`song ${index === currentSongIndex ? 'active' : ''}`} key={song.id}>
              <h3>{song.name}</h3>
              <h4>{song.primaryArtists}</h4>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};


export { Song, Album, Playlist };