import { Grid } from '@chakra-ui/react';
import { Song, Album, Artist } from '../components/song';

export const SearchResults = ({
  searchResults,
  searchType,
  handlePlay,
  handleAddToPlaylist,
  handleAlbumClick,
  handleArtistClick,
}) => (
  <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={4}>
    {searchResults.map((result) => {
      return (
        searchType === 'song' ? (
          <Song
            key={result.id}
            song={result}
            onPlay={handlePlay}
            onAddToPlaylist={handleAddToPlaylist}
          />
        ) : (
          searchType === 'album' ? (
            <Album key={result.id} album={result} handleAlbumClick={handleAlbumClick} />
          ) : (
            searchType === 'artist' ? (
              <Artist key={result.id} artist={result} handleArtistClick={handleArtistClick} />
            ) : null
          )
        )
      );
    })}
  </Grid>
);
