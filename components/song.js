function SongCard(song){
    return (
        <>
                <img className='song-art bordered' src={song.image.find(img => img.quality === '500x500').link} alt={song.name} />
                <h3>{song.name}</h3>
                <FontAwesomeIcon onClick={() => handlePlay(song)} icon={faPlay} />
                <FontAwesomeIcon onClick={() => handleAddToPlaylist(song)} icon={faPlus} />
        </>
    )
}

export default SongCard;