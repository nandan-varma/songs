import { api_link } from '@/lib/api';
import React, { createContext, useState, useContext, useEffect } from 'react';

const SearchContext = createContext();

export const useSearchContext = () => useContext(SearchContext);

export const SearchProvider = ({ children }) => {
  const emptyResult = {
    "topQuery": {
      "results": [],
      "position": 0
    },
    "songs": {
      "results": [],
      "position": 1
    },
    "albums": {
      "results": [],
      "position": 2
    },
    "artists": {
      "results": [],
      "position": 3
    },
    "playlists": {
      "results": [],
      "position": 4
    }
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(emptyResult);
  const ResetSearch = () => {
    setSearchQuery('');
    setSearchResults(emptyResult);
  }
  useEffect(() => {
      if (searchQuery && searchQuery.replace(/\s/g, "") != "") {
        var searchUrl = `${api_link}/search/all?query=${searchQuery}`;

        fetch(searchUrl)
          .then((response) => response.json())
          .then((data) => {
            if (data.data) {
              setSearchResults(data.data);
            } else {
              setSearchResults(emptyResult);
            }
          })
          .catch((error) => {
            console.error('Error fetching search results:', error);
            setSearchResults(emptyResult);
          });
      } else {
        setSearchResults(emptyResult);
      }
  }, [searchQuery]);

  return (
    <SearchContext.Provider value={{ searchQuery, setSearchQuery, searchResults, setSearchResults, emptyResult, ResetSearch }}>
      {children}
    </SearchContext.Provider>
  );
};
