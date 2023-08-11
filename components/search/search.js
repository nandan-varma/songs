import { Button, Box, Flex, Menu, MenuButton, MenuList, MenuItem, Input, Select } from '@chakra-ui/react';
import { useSearchContext } from './SearchContext';
import { SearchResults } from './SearchResults';
import { useRouter } from 'next/router';

const SearchMenu = () => {
  return (
    <>
      <Flex w={'24'} p={'10px'}>
        <Menu>
          {({ isOpen }) => (
            <>
              <MenuButton isActive={isOpen} as={Button}>
                {searchType === 'song' ? 'Song' : searchType === 'album' ? 'Album' : 'Artist'}
              </MenuButton>
              <MenuList>
                <MenuItem onClick={() => setSearchType('song')}>Song</MenuItem>
                <MenuItem onClick={() => setSearchType('album')}>Album</MenuItem>
                <MenuItem onClick={() => setSearchType('artist')}>Artist</MenuItem>
              </MenuList>
            </>
          )}
        </Menu>
      </Flex>
    </>
  )
}

const MainSearch = () => {
  const router = useRouter();
  const { searchQuery, setSearchQuery, searchResults } = useSearchContext();
  const handleSearch = (value) => {
    setSearchQuery(value);
    if (value != "") {
      router.push('/search/' + value);
    }
    else {
      router.push("/")
    }
  }
  return (
    <>
      <Flex m={'4'}>
          <Input autoFocus={true} type="text" value={searchQuery}
            onChange={(event) => handleSearch(event.target.value)}
          />
      </Flex>
      {console.log(searchResults)}
      {searchResults!= undefined && <SearchResults />}
    </>
  );
};

export default MainSearch;
