import { useRouter } from 'next/router';
import AlbumPage from '@/components/Album';
import Playlist from '@/components/PlayList';
import ArtistPage from '@/components/Artist';
import LoadPage from '@/components/LoadPage';
import { useAppContext } from '@/components/AppContext';
import { Player } from '@/components/Player';
import { useSearchContext } from '@/components/search/SearchContext';
import { useEffect } from 'react';

const searchPage = () => {
  const router = useRouter();
  const {pageType} = useAppContext();
  const {setSearchQuery} = useSearchContext();
  const { slug } = router.query;
  useEffect(() => {
    if(slug != null){
      setSearchQuery(slug);
    }
  }, [slug]);
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

export default searchPage;
