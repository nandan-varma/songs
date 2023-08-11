import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import MainSearch from '@/components/search/search';
import AlbumPage from '../components/Album';
import Playlist from '@/components/PlayList';
import ArtistPage from '@/components/Artist';
import LoadPage from '@/components/LoadPage';
import { SearchResults } from '@/components/search/SearchResults'
import Background from '@/components/Background';
import { useAppContext } from '@/components/AppContext';
import { usePlayerContext } from '@/components/PlayerContext';
import { Player } from '@/components/Player';

const Page = () => {
  const router = useRouter();
  const {pageType, setPageType} = useAppContext();
  return (
    <LoadPage>
      <title>Music</title>

      {pageType === 'playlist' && (
        <Playlist/>
      )}

      {pageType === 'album' && (
        <AlbumPage/>
      )}

      {pageType === 'artist' && (
        <ArtistPage/>
      )}
      <Player/>
      {/* <Footer></Footer> */}
    </LoadPage>
  );
};

export default Page;
