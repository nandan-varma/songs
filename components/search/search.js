import { Box, Flex, Input } from '@chakra-ui/react';
import { useSearchContext } from './SearchContext';
import { useRouter } from 'next/router';
import { useState } from 'react';

const MainSearch = () => {
  const router = useRouter();
  const { searchQuery: initialSearchQuery, setSearchQuery } = useSearchContext();
  const [searchQuery, setSearchQueryWithDelay] = useState(initialSearchQuery);
  // const [searchTimeout, setSearchTimeout] = useState(null);

  const handleSearch = (value) => {
    // if (searchTimeout) {
    //   clearTimeout(searchTimeout);
    // }
    // const newTimeout = setTimeout(() => {
      setSearchQuery(value);

      if (value.replace(/\s/g, '') !== '') {
        router.push('/search/' + value);
      } else {
        router.push('/');
      }
    // }, 500);

    // setSearchTimeout(newTimeout);
    setSearchQueryWithDelay(value);
  };

  return (
    <Box>
      <Flex m={'4'}>
        <Input
          autoFocus={true}
          type="text"
          value={searchQuery}
          onChange={(event) => handleSearch(event.target.value)}
        />
      </Flex>
    </Box>
  );
};

export default MainSearch;
