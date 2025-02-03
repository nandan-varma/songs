import { Input } from '@chakra-ui/react';
import { useSearchContext } from './SearchContext';
import { useRouter } from 'next/router';
import { useState, ChangeEvent } from 'react';

const MainSearch: React.FC = () => {
  const router = useRouter();
  const { searchQuery: initialSearchQuery, setSearchQuery } = useSearchContext();
  const [searchQuery, setSearchQueryWithDelay] = useState<string>(initialSearchQuery);

  const handleSearch = (value: string) => {
    setSearchQuery(value);

    if (value.replace(/\s/g, '') !== '') {
      router.push('/search/' + value);
    } else {
      router.push('/');
    }

    setSearchQueryWithDelay(value);
  };

  return (
    <div className="p-4">
      <div className="flex m-4">
        <Input
          autoFocus={true}
          type="text"
          value={searchQuery}
          onChange={(event: ChangeEvent<HTMLInputElement>) => handleSearch(event.target.value)}
          className="border p-2 w-full"
        />
      </div>
    </div>
  );
};

export default MainSearch;
