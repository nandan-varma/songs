import PlaylistItem from "./playlistItem";

export const Playlist = ({
    playlist,
    currentSongIndex,
    handlePlay,
    handleAddToPlaylist,
  }) => (
    <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={4}>
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
    </Grid>
  );
