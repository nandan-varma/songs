import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPlus, faDownload } from '@fortawesome/free-solid-svg-icons';
import { Image, Box, Text, Flex, List, ListItem } from '@chakra-ui/react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import defaultImage from '@/public/song.jpg';
import DownloadIcon from './DownloadIcon';

const Song = ({ song, onPlay, onAddToPlaylist }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  return (
    <Box margin={'4'} boxShadow={'2xl'} borderRadius={'0 0 24px 24px'} key={song.id}>
      {!imageLoaded && (
        <Image
          className='song-art bordered'
          src={defaultImage}
          alt={song.name}
          onLoad={handleImageLoad}
        />
      )}
      <LazyLoadImage
      style={{borderRadius:'24px'}}
        className={`song-art bordered ${imageLoaded ? '' : 'hidden'}`}
        src={song.image.find(img => img.quality === '500x500').link}
        alt={song.name}
        effect='blur'
        afterLoad={handleImageLoad}
        />
      <Flex justifyContent={'center'}>
        <Text fontWeight={'bold'} fontSize={'2xl'}>{song.name}</Text>
      </Flex>
      {/* <Text>{song.primaryArtists}</Text> */}
      {song !== null && (
        <Flex m={'1rem 2.5rem'} className='song-controls' justifyContent={'space-between'}>
          <FontAwesomeIcon size='2x' onClick={() => onPlay(song)} icon={faPlay} />
          <FontAwesomeIcon size='2x' onClick={() => onAddToPlaylist(song)} icon={faPlus} />
          <DownloadIcon downloadUrl={song.downloadUrl[4].link} name={song.name} />
        </Flex>
      )}
    </Box>
  );
};

const Album = ({ album, handleAlbumClick }) => {
  return (
    <Box className='album bordered' key={album.id} onClick={() => { handleAlbumClick(album.id) }}>
      <LazyLoadImage
        className='album-art bordered'
        src={album.image.find(img => img.quality === '500x500').link}
        alt={album.name}
        effect='blur'
        placeholderSrc={defaultImage}
      />
      <Text>{album.name}</Text>
      {/* <Text>{song.primaryArtists}</Text> */}
      {/* <div className='album-controls'> */}
      {/* <FontAwesomeIcon onClick={() => onPlay(album)} icon={faPlay} /> */}
      {/* </div> */}
    </Box>
  );
};

const Artist = ({ artist, handleArtistClick }) => {
  return (
    <List>
      <ListItem className='album bordered' key={artist.id} onClick={() => { handleArtistClick(artist.id) }}>
        <LazyLoadImage
          className='album-art bordered'
          src={artist.image.find(img => img.quality === '500x500').link}
          alt={artist.name}
          effect='blur'
          placeholderSrc={defaultImage}
        />
        <Text>{artist.name}</Text>
        {/* <Text>{song.primaryArtists}</Text> */}
        {/* <div className='album-controls'> */}
        {/* <FontAwesomeIcon onClick={() => onPlay(album)} icon={faPlay} /> */}
        {/* </div> */}
      </ListItem>
    </List>
  );
};

const Playlist = ({ playlist, currentSongIndex }) => {
  const [expanded, setExpanded] = useState(false);

  const handleToggleExpand = () => {
    setExpanded(prevExpanded => !prevExpanded);
  };

  return (
    <Box className={`playlist ${expanded ? 'expanded' : ''}`} onClick={handleToggleExpand}>
      <Box className='current-song'>
        <Text>{playlist[currentSongIndex].name}</Text>
        <Text>{playlist[currentSongIndex].primaryArtists}</Text>
      </Box>
      {expanded && (
        <List className='playlist-songs'>
          {playlist.map((song, index) => (
            <ListItem className={`song ${index === currentSongIndex ? 'active' : ''}`} key={song.id}>
              <Text>{song.name}</Text>
              <Text>{song.primaryArtists}</Text>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export { Song, Album, Playlist, Artist };
