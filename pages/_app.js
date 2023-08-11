import 'react-h5-audio-player/lib/styles.css';
import '@/styles/globals.css'
import { SearchProvider } from '@/components/search/SearchContext';
import { PlayerProvider } from '@/components/PlayerContext';
import { AppProvider } from '@/components/AppContext';
import MainSearch from '@/components/search/search';
import { ChakraProvider } from '@chakra-ui/react';

export default function App({ Component, pageProps }) {
  return (
    <>
      <ChakraProvider>
        <AppProvider>
          <SearchProvider>
            <PlayerProvider>
              <MainSearch />
              <Component {...pageProps} />
            </PlayerProvider>
          </SearchProvider>
        </AppProvider>
      </ChakraProvider>
    </>
  )
}
