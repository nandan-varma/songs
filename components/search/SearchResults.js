import { SimpleGrid } from '@chakra-ui/react';
import { Song, Album, Artist } from '@/components/song';
import { useSearchContext } from './SearchContext';

export function SearchResults() {
  const { searchResults } = useSearchContext();
  return (
    <>
      {(searchResults.length == 0 || searchResults == null) && 
      <>
        <SimpleGrid minChildWidth='xs' spacing={'1'}>
          {
          searchResults.songs.results.map((result) => {
            return (
              <Song
                key={result.id}
                song={result}
              />
            )
          }
          )}
        </SimpleGrid >
        <SimpleGrid minChildWidth='xs' spacing={'1'}>
          {searchResults.albums.results.map((result) => {
            return (
              <Album
                key={result.id}
                album={result}
              />
            )
          }
          )}
        </SimpleGrid>
        <SimpleGrid minChildWidth='xs' spacing={'1'}>
          {searchResults.artists.results.map((result) => {
            return (
              <Artist
                key={result.id}
                artist={result}
              />
            )
          }
          )}
        </SimpleGrid>
      </>
      }
    </>
  )
};
