import { useRouter } from 'next/router';
import { useAppContext } from '@/components/AppContext';
import { useSearchContext } from '@/components/search/SearchContext';
import { useEffect } from 'react';
import { SearchResults } from '@/components/search/SearchResults';

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
    <SearchResults/>
  );
};

export default searchPage;
