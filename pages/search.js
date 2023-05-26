import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import {Song , Album} from '../components/song';

const Search = () => {
  const router = useRouter();

  const [playlist, setPlaylist] = useState([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchType, setSearchType] = useState('song'); // 'song' or 'album'

  useEffect(() => {
    if (searchQuery) {
      let searchUrl = '';
      if (searchType === 'song') {
        searchUrl = `https://saavn.me/search/songs?query=${searchQuery}`;
      } else if (searchType === 'album') {
        searchUrl = `https://saavn.me/search/albums?query=${searchQuery}`;
      }

      fetch(searchUrl)
        .then(response => response.json())
        .then(data => {
          if (data.data && data.data.results) {
            setSearchResults(data.data.results);
          } else {
            setSearchResults([]);
          }
        })
        .catch(error => {
          console.error('Error fetching search results:', error);
          setSearchResults([]);
        });
    }
  }, [searchQuery, searchType]);

  const handlePlay = item => {
    if (searchType === 'song') {
      setPlaylist([item]);
      setCurrentSongIndex(0);
    } else if (searchType === 'album') {
      router.push(`album/${item.id}`);
    }
  };

  const handleAddToPlaylist = item => {
    let songs;
    if (searchType === 'song') {
      songs = [item];
    } else if (searchType === 'album') {
      songs = item.songs;
    }
    setPlaylist(prevPlaylist => [...prevPlaylist, ...songs]);
  };

  const handleNextSong = () => {
    setCurrentSongIndex(prevIndex => (prevIndex + 1) % playlist.length);
  };

  const handlePrevSong = () => {
    if (currentSongIndex > 0) {
      setCurrentSongIndex(prevIndex => (prevIndex - 1) % playlist.length);
    }
  };

  const handleSearchTypeChange = e => {
    setSearchType(e.target.value);
    setSearchQuery('');
  };

  return (
    <>
      <div className='main-search'>
        <input className='bordered' type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        <select name="type" id="type" value={searchType} onChange={handleSearchTypeChange}>
          <option value="song">Song</option>
          <option value="album">Album</option>
        </select>
        <FontAwesomeIcon icon={faMagnifyingGlass} />
        <ul className='songs'>
          {searchResults.map(result =>
            searchType === 'song' ? (
              <Song key={result.id} song={result} onPlay={handlePlay} onAddToPlaylist={handleAddToPlaylist} />
            ) : (
              <Album key={result.id} album={result} onPlay={handlePlay} />
            )
          )}
        </ul>
      </div>
      {playlist.length > 0 && (
        <div style={{ position: 'fixed', bottom: 0, width: '100%' }}>
          <AudioPlayer
            autoPlay
            src={playlist[currentSongIndex].downloadUrl[4].link}
            onEnded={handleNextSong}
            showSkipControls
            onClickNext={handleNextSong}
            onClickPrevious={handlePrevSong}
            showJumpControls={false}
            layout='horizontal-reverse'
          />
        </div>
      )}
    </>
  );
};

export default Search;
