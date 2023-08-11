import AudioPlayer from 'react-h5-audio-player';
import { usePlayerContext } from "./PlayerContext";

export function Player() {
  const {playlist, currentSongIndex, handlePrevSong, handleNextSong} = usePlayerContext();
    return (
        <>
            { (playlist.length > 0) &&
                <div style={{ position: 'fixed', bottom: 0, width: '100%' }}>
                    <AudioPlayer
                        autoPlay
                        src={playlist[currentSongIndex].downloadUrl[4].link}
                        onEnded={handleNextSong}
                        showSkipControls
                        onClickNext={handleNextSong}
                        onClickPrevious={handlePrevSong}
                        showJumpControls={false}
                    />
                </div>
            }
        </>
    )
}