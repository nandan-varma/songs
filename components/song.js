import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPlus } from '@fortawesome/free-solid-svg-icons';
import { Box, Text, Flex, List, ListItem, Center, IconButton, Image } from '@chakra-ui/react';
import DownloadIcon from './DownloadIcon';
import { usePlayerContext } from './PlayerContext';
import { useRouter } from 'next/router';

const Song = ({ song }) => {
  const { handlePlay, handleAddToPlaylist } = usePlayerContext();
  return (
    <Center>
      <Box m={'2'}
        className='blur'
        w={{ base: '64', sm: '70%', md: '60' }}
        borderRadius={'24px'} key={song.id}
        _hover={{ borderColor: 'white', boxShadow: '0 0 3px 2.5px gray' }}
      >
        <Image
          objectFit={'cover'}
          borderRadius={'24px'}
          aspectRatio={'1'}
          className='song-art bordered'
          src={song.image[2].link}
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
            <IconButton m={'1'} onClick={() => { handlePlay(song) }} icon={<FontAwesomeIcon icon={faPlay} />} />
            <IconButton m={'1'} onClick={() => { handleAddToPlaylist(song) }} icon={<FontAwesomeIcon icon={faPlus} />} />
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
      <Box m={'2'}
        className='blur'
        w={{ base: '64', sm: '70%', md: '60' }}
        borderRadius={'24px'} key={album.id}
        _hover={{ borderColor: 'white', boxShadow: '0 0 6px 5px gray' }}
        onClick={()=>{router.push("/album/"+album.id)}}
      >
        <Image
          objectFit={'cover'}
          borderRadius={'24px'}
          aspectRatio={'1'}
          className='album-art bordered'
          src={album.image.find(img => img.quality === '500x500').link}
          alt={album.title}
          effect='blur'
        />
        <Box p={'2'} h={'32'} textAlign={'center'} justifyContent={'center'}>
          <Text fontWeight={'bold'} fontSize={'lg'}>{
            album.title.replace(/&quot;/g, '"')}</Text>
          <Text fontStyle={'italic'}>{album.artist}</Text>
        </Box>
      </Box>
    </Center>
  );
};

const Artist = ({ artist, handleArtistClick }) => {
  return (
    <Center>
      <Box m={'2'}
        className='blur'
        w={{ base: '64', sm: '70%', md: '60' }}
        borderRadius={'24px'} key={artist.id}
        _hover={{ borderColor: 'white', boxShadow: '0 0 6px 5px gray' }}
      >
        <Image
          objectFit={'cover'}
          borderRadius={'24px'}
          aspectRatio={'1'}
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
