import { Center, Heading, SimpleGrid, Text } from '@chakra-ui/react';
import { Song, Album, Artist } from '@/components/song';
import { useSearchContext } from './SearchContext';

export function SearchResults() {
  const { searchResults } = useSearchContext();
  return (
    <>
      {(searchResults != null) &&
        <>
          {searchResults.songs.results.length == 0 ? <Center><Text w={'lg'} mt={'8'} textAlign={'center'}> keep searching bcuz there is nothing to show here</Text></Center> :
            <>
              <Text textAlign={'center'} as={Heading}>Songs</Text>
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
          <Text textAlign={'center'} as={Heading}>Albums</Text>
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
          {/* <Text textAlign={'center'} as={Heading}>Artists</Text>
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
          </SimpleGrid> */}
          </>
        }
        </>
      }
    </>
  )
};
