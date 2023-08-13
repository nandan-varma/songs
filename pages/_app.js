import 'react-h5-audio-player/lib/styles.css';
import '@/styles/globals.css'
import { SearchProvider } from '@/components/search/SearchContext';
import { PlayerProvider } from '@/components/PlayerContext';
import { AppProvider } from '@/components/AppContext';
import MainSearch from '@/components/search/search';
import { ChakraProvider } from '@chakra-ui/react';
import { Navbar } from '@/components/Navbar';
import { Player } from '@/components/Player';

export default function App({ Component, pageProps }) {
  return (
    <>
      <ChakraProvider>
        <AppProvider>
          <SearchProvider>
            <PlayerProvider>
              <Navbar/>
              <MainSearch />
              <Component {...pageProps} />
              <Player/>
            </PlayerProvider>
          </SearchProvider>
        </AppProvider>
      </ChakraProvider>
    </>
  )
}
