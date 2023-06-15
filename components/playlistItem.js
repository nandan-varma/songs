import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp } from '@fortawesome/free-solid-svg-icons';

const PlaylistItem = ({ song, onPlay, onAddToPlaylist , currentSongIndex , index }) => {
    return (
      <li className={currentSongIndex == index ? 'current song bordered' : 'song bordered'} key={song.id}>
        {/* <img className='song-art bordered' src={song.image.find(img => img.quality === '500x500').link} alt={song.name} /> */}
        <h3>{song.name}</h3>
        {/* <h4>{song.primaryArtists}</h4> */}
        <div className='song-controls'>
          {/* <FontAwesomeIcon onClick={() => onPlay(song)} icon={faArrowUp} /> */}
        </div>
      </li>
    );
  };

export default PlaylistItem;