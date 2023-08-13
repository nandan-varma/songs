import AudioPlayer from 'react-h5-audio-player';
import { usePlayerContext } from "./PlayerContext";
import { useEffect, useState } from 'react';
import { Box, Center } from '@chakra-ui/react';

export function Player() {
    const { playlist, currentSongIndex, handlePrevSong, handleNextSong, getDownloadUrl } = usePlayerContext();
    var currentUrl = null;
    useEffect(() => {
        if (playlist.length != 0) {
            getDownloadUrl(playlist[currentSongIndex].id).then((url) => {
                console.log(url);
                currentUrl = url;
            })
        }
    }, [currentSongIndex]);
    return (
        <>
            {(playlist.length > 0) &&
                <Center>
                    <Box pos={'fixed'} bottom={'0'}>
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
            }
        </>
    )
}