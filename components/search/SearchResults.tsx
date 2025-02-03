import { Center, Heading, Stack, Text, useMediaQuery } from '@chakra-ui/react';
import { HSong, HAlbum } from '../song';
import { useSearchContext } from './SearchContext';

interface Song {
  id: string;
  // ...other properties...
}

interface Album {
  id: string;
  // ...other properties...
}

export function SearchResults() {
  const { searchResults } = useSearchContext();
  const [isLargerThan600] = useMediaQuery('(min-width: 600px)')

  return (
    <>
      {(searchResults != null) &&
        <>
          {searchResults.songs.results.length == 0 ? <Center><Text w={'lg'} mt={'8'} textAlign={'center'}> Loading.</Text></Center> :
            <>
              <Text textAlign={'center'} as={Heading}>Songs</Text>
              <Stack>
                {
                  searchResults.songs.results.map((result: Song) => {
                    if (isLargerThan600) {
                      return (
                        <HSong
                          key={result.id}
                          song={result}
                        />
                      )
                    } else {
                      return (
                        <HSong
                          key={result.id}
                          song={result}
                        />
                      )
                    }
                  }
                  )}
              </Stack >
              <Text textAlign={'center'} as={Heading}>Albums</Text>
              <Stack>
                {searchResults.albums.results.map((result: Album) => {
                  return (
                    <HAlbum
                      key={result.id}
                      album={result}
                    />
                  )
                }
                )}
              </Stack>
            </>
          }
        </>
      }
    </>
  )
};
