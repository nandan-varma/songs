import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPlus } from '@fortawesome/free-solid-svg-icons';
import { Box, Text, Flex, List, ListItem, Center } from '@chakra-ui/react';
import DownloadIcon from './DownloadIcon';
import { usePlayerContext } from './PlayerContext';
import { useAppContext } from './AppContext';

const Song = ({ song }) => {
  const { handlePlay, handleAddToPlaylist } = usePlayerContext();

  const getDownloadUrl = () => {
    var url = null;
    if (song.downloadUrl == null || song.downloadUrl == undefined) {
      
      fetch(`https://saavn-api.nandanvarma.com/songs?id=${song.id}`)
        .then((response) => response.json())
        .then((res) => {
          if (res.data) {
            url = res.data.downloadUrl[4].link;
          } else {
            url = null;
          }
        })
    }
    else {
      url = song.downloadUrl[4].link;
    }
  }

  return (
    <Center>
      <Box w={'64'} className='blur' margin={'4'} boxShadow={'2xl'} borderRadius={'0 0 24px 24px'} key={song.id}>
        <img
          className='song-art bordered'
          src={song.image.find(img => img.quality === '500x500').link}
          alt={song.name}
        />
        <Box textAlign={'center'} justifyContent={'center'}>
          <Text fontWeight={'bold'} fontSize={'2xl'}>{
            song.name}</Text>
          <Text fontStyle={'italic'}>{song.primaryArtists}</Text>
        </Box>
        {song !== null && (
          <Flex m={'1rem 2.5rem'} className='song-controls' justifyContent={'space-between'}>
            <FontAwesomeIcon size='2x' onClick={() => handlePlay(song)} icon={faPlay} />
            <FontAwesomeIcon size='2x' onClick={() => handleAddToPlaylist(song)} icon={faPlus} />
              {/* <DownloadIcon downloadUrl={getDownloadUrl()} name={song.name} /> */}
          </Flex>
        )}
      </Box>
    </Center>
  );
};

const Album = ({ album }) => {
  const { content, SetContent } = useAppContext();
  return (
    <Box className='blur' margin={'4'} boxShadow={'2xl'} borderRadius={'0 0 24px 24px'} key={album.id} onClick={() => { SetContent({ type: "album", id: album.id }) }}>
      <img
        className='album-art bordered'
        src={album.image.find(img => img.quality === '500x500').link}
        alt={album.name}
        effect='blur'
      />
      <Text textAlign={'center'} p={'4'} fontWeight={'bold'}>{album.name}</Text>
      {/* <Text p={'4'} textAlign={'center'}>{album.primaryArtists.map(artist => artist.name).join(', ')}</Text> */}
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
        <img
          className='album-art bordered'
          src={artist.image.find(img => img.quality === '500x500').link}
          alt={artist.name}
          effect='blur'
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
