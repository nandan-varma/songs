import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPlus } from '@fortawesome/free-solid-svg-icons';
import { Box, Text, Flex, List, ListItem, Center, IconButton } from '@chakra-ui/react';
import DownloadIcon from './DownloadIcon';
import { usePlayerContext } from './PlayerContext';
import { useRouter } from 'next/router';

const Song = ({ song }) => {
  const { handlePlay, handleAddToPlaylist } = usePlayerContext();
  return (
    <Center>
      <Box w={'64'} className='blur' margin={'4'} boxShadow={'2xl'} borderRadius={'0 0 24px 24px'} key={song.id}>
        <img
          className='song-art bordered'
          src={song.image.find(img => img.quality === '500x500').link}
          alt={song.title}
        />
        <Box p={'2'} h={'20'} textAlign={'center'} justifyContent={'center'}>
          <Text fontWeight={'bold'} fontSize={'lg'}>{
            song.title}</Text>
          <Text fontWeight={'medium'} fontSize={'lg'}>{
            song.album}</Text>
          <Text fontStyle={'italic'}>{song.primaryArtists}</Text>
        </Box>
        {song !== null && (
          <Flex m={'6'} className='song-controls' justifyContent={'space-between'}>
            <IconButton m={'1'} onClick={()=>{handlePlay(song)}} icon={<FontAwesomeIcon icon={faPlay} />}/>
            <IconButton m={'1'} onClick={()=>{handleAddToPlaylist(song)}} icon={<FontAwesomeIcon icon={faPlus} />}/>
            <DownloadIcon id={song.id} downloadUrl={song.downloadUrl} name={song.title} />
          </Flex>
        )}
      </Box>
    </Center>
  );
};

const Album = ({ album }) => {
  const router = useRouter();
  return (
    <Center>
      <Box w={'64'} className='blur' margin={'4'} boxShadow={'2xl'} borderRadius={'0 0 24px 24px'} key={album.id} onClick={() => {router.push("/album/"+album.id)}}>
        <img
          className='album-art bordered'
          src={album.image.find(img => img.quality === '500x500').link}
          alt={album.title}
          effect='blur'
        />
        <Box p={'2'} h={'24'} textAlign={'center'} justifyContent={'center'}>
          <Text fontWeight={'bold'} fontSize={'lg'}>{
            album.title}</Text>
          <Text fontStyle={'italic'}>{album.artist}</Text>
        </Box>
      </Box>
    </Center>
  );
};

const Artist = ({ artist, handleArtistClick }) => {
  return (
    <Center>
      <Box w={'64'} className='blur' margin={'4'} boxShadow={'2xl'} borderRadius={'0 0 24px 24px'} key={artist.id}>
        <img
          className='song-art bordered'
          src={artist.image.find(img => img.quality === '500x500').link}
          alt={artist.title}
        />
        <Box p={'2'} h={'20'} textAlign={'center'} justifyContent={'center'}>
          <Text fontWeight={'bold'} fontSize={'lg'}>{
            artist.title}</Text>
          <Text fontStyle={'italic'}>{artist.description}</Text>

        </Box>
      </Box>
    </Center>
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
