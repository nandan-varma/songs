import { Button, Box, Flex, Menu, MenuButton, MenuList, MenuItem, Input, Select } from '@chakra-ui/react';
import { useSearchContext } from './SearchContext';
import { useRouter } from 'next/router';

const SearchMenu = () => {
  return (
    <>
      <Flex>
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
    if (value.replace(/\s/g, "") != "") {
      router.push('/search/' + value);
    }
    else {
      router.push("/");
    }
  }
  return (
    <>
      <Box>
        <Flex m={'4'}>
          <Input autoFocus={true} type="text" value={searchQuery}
            onChange={(event) => handleSearch(event.target.value)}
          />
        </Flex>
      </Box>
    </>
  );
};

export default MainSearch;
