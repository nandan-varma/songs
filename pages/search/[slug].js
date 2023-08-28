import { useRouter } from 'next/router';
import { useSearchContext } from '@/components/search/SearchContext';
import { useEffect } from 'react';
import { SearchResults } from '@/components/search/SearchResults';

const searchPage = () => {
  const router = useRouter();
  const {setSearchQuery} = useSearchContext();
  const { slug } = router.query;
  useEffect(() => {
    if(slug != null){
      setSearchQuery(slug);
    }
  }, [slug]);
  return (
    <>
    <title>Search for {slug}</title>
    <SearchResults/>
    </>
  );
};

export default searchPage;
