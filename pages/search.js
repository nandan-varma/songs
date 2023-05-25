import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlay, faPlus, faMagnifyingGlass, faDownload } from '@fortawesome/free-solid-svg-icons'
const AlbumPage = () => {
    const router = useRouter();

    const [playlist, setPlaylist] = useState([]);
    const [currentSongIndex, setCurrentSongIndex] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    useEffect(() => {
        if (searchQuery) {
            fetch(`https://jiosaavn-api-ebon-one.vercel.app/search/songs?query=${searchQuery}`)
                .then(response => response.json())
                .then(data => {
                    if (data.data) {
                        setSearchResults(data.data.results)
                    }
                    else {
                        setSearchResults([])
                    }
                });
        }
    }, [searchQuery]);

    if (!searchResults) return <div>Nothing to show</div>;

    const handlePlay = song => {
        console.log(song)
        setPlaylist([song]);
        setCurrentSongIndex(0);
    };

    const handleAddToPlaylist = song => {
        setPlaylist(prevPlaylist => [...prevPlaylist, song]);
    };

    const handleNextSong = () => {
        setCurrentSongIndex(prevIndex => (prevIndex + 1) % playlist.length);
    };

    return (
        <>
            <div className='main-search'>
                <input className='bordered' type="text" onChange={e => setSearchQuery(e.target.value)} />
                <FontAwesomeIcon icon={faMagnifyingGlass} />
                <ul className='songs'>
                    {searchResults.map(song => (
                        <li className='song bordered' key={song.id}>
                            <img className='song-art bordered' src={song.image.find(img => img.quality === '500x500').link} alt={song.name} />
                            <h3>{song.name}</h3>
                            <h4>{song.primaryArtists}</h4>
                            <div className='song-controls'>
                                <FontAwesomeIcon onClick={() => handlePlay(song)} icon={faPlay} />
                                <FontAwesomeIcon onClick={() => handleAddToPlaylist(song)} icon={faPlus} />
                                <FontAwesomeIcon onClick={() => handleAddToPlaylist(song)} icon={faDownload} />
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            {playlist.length > 0 && (
                <div style={{ position: 'fixed', bottom: 0, width: '100%' }}>
                    <AudioPlayer
                        src={playlist[currentSongIndex].downloadUrl.find(url => url.quality === '160kbps').link}
                        onEnded={handleNextSong}
                        showSkipControls
                        onClickNext={handleNextSong}
                    />
                </div>
            )}

        </>
    );
};

export default AlbumPage;
