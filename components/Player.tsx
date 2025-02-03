import React, { createRef, useEffect, useState } from 'react';
import AudioPlayer from 'react-h5-audio-player';
import { usePlayerContext } from './PlayerContext';
import { Box, Center, Image, Text } from '@chakra-ui/react';

function setMetaData(song){
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.primaryArtists,
      album: "The Ultimate Collection (Remastered)",
      artwork: [
        {
          src: song.image[0].link,
          sizes: "50x50",
          type: "image/jpg",
        },
        {
          src: song.image[1].link,
          sizes: "150x150",
          type: "image/jpg",
        },
        {
          src: song.image[2].link,
          sizes: "500x500",
          type: "image/jpg",
        }
      ],
    });
  }
}

export function Player() {
  const {
    playlist,
    currentSongIndex,
    currentImage,
    SetCurrentImage,
    handlePrevSong,
    handleNextSong,
    getDownloadUrl,
  } = usePlayerContext();
  const [currentUrl, setCurrentUrl] = useState(null);
  const PlayerRef = createRef<AudioPlayer>()
  useEffect(() => {
    let song = playlist[currentSongIndex];
    if(PlayerRef.current != null){
      console.log(PlayerRef.current.audio.current);
      setMetaData(song);
    }
    if (playlist.length > 0) {
      getDownloadUrl(song.id)
      .then((url) => {
        setCurrentUrl(url);
        SetCurrentImage(song.image[2].link);
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
          <Box p={'3'} display={'flex'} justifyContent={'space-evenly'} pos="fixed" bottom="0" height={'32'}>
            <Image
              objectFit={'cover'}
              borderRadius={'12px 0 0 12px'}
              aspectRatio={'1'}
              className='song-art bordered'
              src={currentImage}
              alt={"current song"}
            />
            <AudioPlayer
            ref={PlayerRef}
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
