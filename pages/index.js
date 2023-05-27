import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft,faMusic } from '@fortawesome/free-solid-svg-icons';
import { Song, Album, Playlist } from '../components/song';
import { useContext } from 'react';

const Search = () => {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [albumID, setAlbumID] = useState(null);
    const [albumData, setAlbumData] = useState(null);
    const [playlist, setPlaylist] = useState([]);
    const [currentSongIndex, setCurrentSongIndex] = useState(0);
    const [searchResults, setSearchResults] = useState([]);
    const [pageType, setPageType] = useState('search') // 'album' or 'search'
    const [searchType, setSearchType] = useState('song'); // 'song' or 'album'
    const [history, setHistory] = useState([]);
    // history : pagetype : "" , value : ""

    useEffect(() => {
        if (albumID) {
            fetch(`https://jiosaavn-api-ebon-one.vercel.app/albums?id=${albumID}`)
                .then(response => response.json())
                .then(data => {
                    if (data.data) {
                        setAlbumData(data.data);
                    } else {
                        setAlbumData(null);
                    }
                })
                .catch(error => {
                    console.error('Error fetching album data:', error);
                    setAlbumData(null);
                });
        }
    }, [albumID]);

    useEffect(() => {
        if (searchQuery) {
            if(pageType === "album"){
                setPageType("search");
            }
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
        else{
            setSearchResults([]);
        }
    }, [searchQuery, searchType]);

    const handlePlay = item => {
            setPlaylist([item]);
            setCurrentSongIndex(0);
    };

    const handleAddToPlaylist = item => {
        setPlaylist(prevPlaylist => [...prevPlaylist, item]);
        console.log(playlist)
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
        setSearchQuery('');
        setSearchType(e.target.value);
    };

    const handleAlbumClick = (ID) => {
        setAlbumID(ID);
        setPageType("album");
    }

    const handleBackKey = () => {
        if(pageType === "album"){
            setPageType("search");
        }
    }

    return (
        <>
            <div className='main-search'>
                <FontAwesomeIcon icon={faArrowLeft} onClick={handleBackKey} />
                {/* <FontAwesomeIcon icon={faMusic} onClick={handleBackKey} /> */}
                <input className='bordered' type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                <select name="type" id="type" value={searchType} onChange={handleSearchTypeChange}>
                    <option value="song">Song</option>
                    <option value="album">Album</option>
                </select>
            </div>

                {pageType === "search" && (
                    <ul className="songs">
                        {searchResults.map((result) =>
                            searchType === "song" ? (
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
                {pageType === "album" && (
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
                )}

            {playlist.length > 0 && (
                <div style={{ position: 'fixed', bottom: 0, width: '100%' }}>
                    {/* <Playlist playlist={playlist} currentSongIndex={currentSongIndex}></Playlist> */}
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

export default Search;
