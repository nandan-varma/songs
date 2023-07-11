import PlaylistItem from "./playlistItem";

export const Playlist = ({
    playlist,
    currentSongIndex,
    handlePlay,
    handleAddToPlaylist,
  }) => (
    <ul className="playlist">
      {playlist.map((result, index) =>
        <PlaylistItem
          key={result.id}
          song={result}
          onPlay={handlePlay}
          onAddToPlaylist={handleAddToPlaylist}
          currentSongIndex={currentSongIndex}
          index={index}
        />
      )}
    </ul>
  );
