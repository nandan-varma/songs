import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faMusic } from '@fortawesome/free-solid-svg-icons';
import { Song, Album } from '../components/song';
import MainSearch from '../components/search';
import AlbumPage from '../components/Album';
import PlaylistItem from '@/components/playlistItem';

const MainPage = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [albumID, setAlbumID] = useState(null);
  const [albumData, setAlbumData] = useState(null);
  const [playlist, setPlaylist] = useState([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [searchResults, setSearchResults] = useState([]);
  const [pageType, setPageType] = useState('search'); // 'album' or 'search' or 'playlist' or 'artist'
  const [searchType, setSearchType] = useState('song'); // 'song' or 'album' or 'artist'
  const [history, setHistory] = useState([]);
  // history: pagetype: "", value: ""

  useEffect(() => {
    if (albumID) {
      fetch(`https://jiosaavn-api-ebon-one.vercel.app/albums?id=${albumID}`)
        .then((response) => response.json())
        .then((data) => {
          if (data.data) {
            setAlbumData(data.data);
          } else {
            setAlbumData(null);
          }
        })
        .catch((error) => {
          console.error('Error fetching album data:', error);
          setAlbumData(null);
        });
    }
  }, [albumID]);

  useEffect(() => {
    if (searchQuery) {
      if (pageType !== 'search') {
        setPageType('search');
      }
      let searchUrl = '';
      if (searchType === 'song') {
        searchUrl = `https://saavn.me/search/songs?query=${searchQuery}`;
      } else if (searchType === 'album') {
        searchUrl = `https://saavn.me/search/albums?query=${searchQuery}`;
      }
      else if (searchType === 'artist') {
        searchUrl = `https://saavn.me/search/artists?query=${searchQuery}`;
      }

      fetch(searchUrl)
        .then((response) => response.json())
        .then((data) => {
          if (data.data && data.data.results) {
            setSearchResults(data.data.results);
          } else {
            setSearchResults([]);
          }
        })
        .catch((error) => {
          console.error('Error fetching search results:', error);
          setSearchResults([]);
        });
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, searchType]);

  const handleClick = (type, value) => {
    setHistory([...history, { type: type, value: value }]);
    console.log(history);
  };

  const handleBackKey = () => {
    console.log(history);
    if (pageType !== 'search') {
      setPageType('search');
    }
    let lastPos = history[history.length - 1];
    setHistory(history.slice(0, -1));
  };

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

  const handleSearchTypeChange = (e) => {
    setSearchQuery('');
    setSearchType(e.target.value);
  };

  const handleAlbumClick = (ID) => {
    setAlbumID(ID);
    setPageType('album');
    handleClick();
  };

  const handlePlaylist = (ID) => {
    setPageType('playlist')
    handleClick();
  };

  return (
    <>
      <MainSearch
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchType={searchType}
        setSearchType={setSearchType}
        handleBackKey={handleBackKey}
        handlePlaylist={handlePlaylist}
      />

      {pageType === 'search' && (
        <ul className="songs">
          {searchResults.map((result) =>
            searchType === 'song' ? (
              <Song
                key={result.id}
                song={result}
                onPlay={handlePlay}
                onAddToPlaylist={handleAddToPlaylist}
              />
            ) : (
              <Album key={result.id} album={result} handleAlbumClick={handleAlbumClick} />
            )
          )}
        </ul>
      )}

      {pageType === 'playlist' && (
        <ul className="playlist">
        {playlist.map((result,index) =>
          searchType === 'song' ? (
            <>
            <PlaylistItem
              key={result.id}
              song={result}
              onPlay={handlePlay}
              onAddToPlaylist={handleAddToPlaylist}
              currentSongIndex={currentSongIndex}
              index={index}
            />
            </>
          ) : (
            <Album key={result.id} album={result} handleAlbumClick={handleAlbumClick} />
          )
        )}
        </ul>
      )}

      {pageType === 'album' && (
        <AlbumPage
          albumData={albumData}
          handlePlay={handlePlay}
          handleAddToPlaylist={handleAddToPlaylist}
        />
      )}

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
          />
        </div>
      )}
    </>
  );
};

export default MainPage;
