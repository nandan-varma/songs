import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft,faMusic } from '@fortawesome/free-solid-svg-icons';

const MainSearch = ({ searchQuery, setSearchQuery, searchType, setSearchType, handleBackKey , handlePlaylist }) => {
  const handleSearchTypeChange = e => {
    setSearchQuery('');
    setSearchType(e.target.value);
  };

  return (
    <div className='main-search'>
      <FontAwesomeIcon icon={faArrowLeft} onClick={handleBackKey} />
      <FontAwesomeIcon icon={faMusic} onClick={handlePlaylist} />
      <input className='bordered' type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
      <select name="type" id="type" value={searchType} onChange={handleSearchTypeChange}>
        <option value="song">Song</option>
        <option value="album">Album</option>
        <option value="artist">Artist</option>
      </select>
    </div>
  );
};

export default MainSearch;