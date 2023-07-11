import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faMusic } from '@fortawesome/free-solid-svg-icons';
import { Button, Box, Flex, Menu, MenuButton, MenuList, MenuItem, Input, Select } from '@chakra-ui/react';

const MainSearch = ({ searchQuery, searchType, setSearchQuery, handleSearchTypeChange, handleBackKey, handlePlaylist }) => {


  return (
    <Flex alignItems="center">
      <Flex w={'10vw'}>
      <FontAwesomeIcon width={'10vw'} icon={faArrowLeft} onClick={handleBackKey} />
      {/* <FontAwesomeIcon width={'10vw'} icon={faMusic} onClick={handlePlaylist} /> */}
      </Flex>
      <Flex w={'70vw'}>
      <Input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
      </Flex>
      <Flex w={'20vw'} p={'10px'}>
      <Menu>
        {({ isOpen }) => (
          <>
            <MenuButton isActive={isOpen} as={Button}>
              {searchType === 'song' ? 'Song' : searchType === 'album' ? 'Album' : 'Artist'}
            </MenuButton>
            <MenuList>
              <MenuItem onClick={() => handleSearchTypeChange('song')}>Song</MenuItem>
              <MenuItem onClick={() => handleSearchTypeChange('album')}>Album</MenuItem>
              <MenuItem onClick={() => handleSearchTypeChange('artist')}>Artist</MenuItem>
            </MenuList>
          </>
        )}
      </Menu>
      </Flex>
    </Flex>
  );
};

export default MainSearch;
