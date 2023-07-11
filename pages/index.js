import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AudioPlayer from 'react-h5-audio-player';
import MainSearch from '../components/search';
import AlbumPage from '../components/Album';
import Playlist from '@/components/PlayList';
import ArtistPage from '@/components/Artist';
import LoadPage from '@/components/LoadPage';
import { SearchResults } from '@/components/SearchResults'
import Footer from '@/components/Footer';

const MainContainer = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [albumID, setAlbumID] = useState(null);
  const [artistID, setArtistID] = useState(null);
  const [artistData, setArtistData] = useState(null);
  const [albumData, setAlbumData] = useState(null);
  const [playlist, setPlaylist] = useState([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [searchResults, setSearchResults] = useState([]);
  const [pageType, setPageType] = useState('search'); // 'album' or 'search' or 'playlist' or 'artist'
  const [searchType, setSearchType] = useState('song'); // 'song' or 'album' or 'artist'
  const [history, setHistory] = useState([]);

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
    if (artistID) {
      fetch(`https://jiosaavn-api-ebon-one.vercel.app/artists?id=${artistID}`)
        .then((response) => response.json())
        .then((data) => {
          if (data.data) {
            setArtistData(data.data);
          } else {
            setArtistData(null);
          }
        })
        .catch((error) => {
          console.error('Error fetching album data:', error);
          setArtistData(null);
        });
    }
  }, [artistID]);

  useEffect(() => {
    if (searchQuery) {
      if (pageType !== 'search') {
        setPageType('search');
      }
      let searchUrl = '';
      if (searchType === 'song') {
        searchUrl = `https://jiosaavn-cvjy6pyk5-nandan-varma.vercel.app/search/songs?query=${searchQuery}`;
      } else if (searchType === 'album') {
        searchUrl = `https://jiosaavn-cvjy6pyk5-nandan-varma.vercel.app/search/albums?query=${searchQuery}`;
      } else if (searchType === 'artist') {
        searchUrl = `https://jiosaavn-cvjy6pyk5-nandan-varma.vercel.app/search/artists?query=${searchQuery}`;
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

  const handleAlbumClick = (ID) => {
    setAlbumID(ID);
    setPageType('album');
    handleClick();
  };

  const handleArtistClick = (ID) => {
    setArtistID(ID);
    setPageType('artist');
    handleClick();
  };

  const handlePlaylist = (ID) => {
    setPageType('playlist');
    handleClick();
  };

  const handleSearchTypeChange = value => {
    setSearchQuery('');
    setSearchType(value);
  };

  return (
    <LoadPage>
      <title>Music</title>
      <MainSearch
        handleSearchTypeChange={handleSearchTypeChange}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchType={searchType}
        setSearchType={setSearchType}
        handleBackKey={handleBackKey}
        handlePlaylist={handlePlaylist}
      />

      {pageType === 'search' && (
        <SearchResults
          searchResults={searchResults}
          searchType={searchType}
          handlePlay={handlePlay}
          handleAddToPlaylist={handleAddToPlaylist}
          handleAlbumClick={handleAlbumClick}
          handleArtistClick={handleArtistClick}
        />
      )}

      {pageType === 'playlist' && (
        <Playlist
          playlist={playlist}
          currentSongIndex={currentSongIndex}
          handlePlay={handlePlay}
          handleAddToPlaylist={handleAddToPlaylist}
        />
      )}

      {pageType === 'album' && (
        <AlbumPage
          albumData={albumData}
          handlePlay={handlePlay}
          handleAddToPlaylist={handleAddToPlaylist}
        />
      )}

      {pageType === 'artist' && (
        <ArtistPage
          artistData={artistData}
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
      <Footer></Footer>
    </LoadPage>
  );
};

const MainPage = () => {
  return (
    <MainContainer />
  );
};

export default MainPage;
