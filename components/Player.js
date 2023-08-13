import React, { useEffect, useState } from 'react';
import AudioPlayer from 'react-h5-audio-player';
import { usePlayerContext } from './PlayerContext';
import { Box, Center } from '@chakra-ui/react';

export function Player() {
  const {
    playlist,
    currentSongIndex,
    handlePrevSong,
    handleNextSong,
    getDownloadUrl,
  } = usePlayerContext();
  const [currentUrl, setCurrentUrl] = useState(null);

  useEffect(() => {
    if (playlist.length > 0) {
      getDownloadUrl(playlist[currentSongIndex].id)
        .then((url) => {
          setCurrentUrl(url);
        })
        .catch((error) => {
          console.error('Error fetching download URL:', error);
          setCurrentUrl(null);
        });
    }
  }, [currentSongIndex, getDownloadUrl, playlist]);

  return (
    <>
      {playlist.length > 0 && (
        <Center>
          <Box pos="fixed" bottom="0">
            <AudioPlayer
              autoPlay
              src={currentUrl}
              onEnded={handleNextSong}
              showSkipControls
              onClickNext={handleNextSong}
              onClickPrevious={handlePrevSong}
              showJumpControls={false}
            />
          </Box>
        </Center>
      )}
    </>
  );
}
