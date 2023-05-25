import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AudioPlayer from 'react-h5-audio-player';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlay, faPlus, faMagnifyingGlass, faDownload } from '@fortawesome/free-solid-svg-icons'

const AlbumPage = () => {
    const router = useRouter();
    const { albumID } = router.query;

    const [albumData, setAlbumData] = useState(null);
    const [playlist, setPlaylist] = useState([]);
    const [currentSongIndex, setCurrentSongIndex] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    useEffect(() => {
        if (albumID) {
            try{
            fetch(`https://jiosaavn-api-ebon-one.vercel.app/albums?id=${albumID}`)
                .then(response => response.json())
                .then(data => setAlbumData(data.data));
            }
            catch{
                router.push('/404');
            }
        }
    }, [albumID]);

    useEffect(() => {
        if (searchQuery) {
            try{
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
            catch{
                router.push('/404');
            }
        }
    }, [searchQuery]);

    if (!albumData) return <div>Loading... wait if you want to see anything</div>;

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

    const handlePrevSong = () => {
        if(prevIndex > 0){
        setCurrentSongIndex(prevIndex => (prevIndex - 1) % playlist.length);
        }
    };

    return (
        <>
            <div className='search-box'>
            <input className='bordered' type="text" onChange={e => setSearchQuery(e.target.value)} />
            <FontAwesomeIcon icon={faMagnifyingGlass}/>
                <ul>
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
            <div className='album-box'>
                <img className='background-art' src={albumData.image.find(img => img.quality === '50x50').link} alt={albumData.name} />
                <h1>{albumData.name}</h1>
                <img className='bordered' src={albumData.image.find(img => img.quality === '500x500').link} alt={albumData.name} />
                <ul className='songs'>
                    {albumData.songs.map(song => (
                        <li className='song bordered' key={song.id}>
                            <img className='song-art bordered' src={song.image.find(img => img.quality === '500x500').link} alt={song.name} />
                            <h3>{song.name}</h3>
                            <p>{song.primaryArtists}</p>
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
                        onClickPrevious={handlePrevSong}
                    />
                </div>
            )}

        </>
    );
};

export default AlbumPage;
