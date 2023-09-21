import React from 'react';
import { Box, Flex, IconButton, Image, Text } from '@chakra-ui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faTrash, faBars } from '@fortawesome/free-solid-svg-icons';
import { usePlayerContext } from './PlayerContext';

const PlaylistItem = ({ song, onPlay, onRemove, index }) => {
  const { currentSongIndex } = usePlayerContext();
  return (
    <Flex alignItems="center" p={2} borderBottom="1px solid #ccc">
      <Box flex="1" m={4}>
        <Image src={song.image[0].link} alt={song.title} boxSize="50px" />
      </Box>
      <Box flex="4" >
        <Text style={{textDecoration:(index==currentSongIndex)?'underline':'none'}}>{song.title}</Text>
        <Text fontSize="sm" color="gray.500">
          {song.primaryArtists}
        </Text>
      </Box>
      <Box flex="2">
        <IconButton
          icon={<FontAwesomeIcon icon={faPlay} />}
          aria-label="Play"
          onClick={() => onPlay(song)}
        />
        <IconButton
          icon={<FontAwesomeIcon icon={faTrash} />}
          aria-label="Remove"
          onClick={() => onRemove(song)}
          ml={2}
        />
        {/* <IconButton
          icon={<FontAwesomeIcon icon={faBars} />}
          aria-label="Rearrange"
          ml={2}
          cursor="grab"
        /> */}
      </Box>
    </Flex>
  );
};

const Playlist = () => {
  const { playlist, handlePlay, handleRemovePlaylist } = usePlayerContext();
  function onRemove() {

  }
  return (
    <Box mt={4}>
      {playlist.length == 0 ? <Text textAlign={'center'}>Add some songs to see your song queue</Text> :
        <>
          {playlist.map((song, index) => (
            <PlaylistItem
              key={song.id}
              song={song}
              index={index}
              onPlay={handlePlay}
              onRemove={handleRemovePlaylist}
            />
          ))}
        </>}
    </Box>
  );
};

export default Playlist;
