import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAppContext } from '../AppContext';

const SearchContext = createContext();

export const useSearchContext = () => useContext(SearchContext);

export const SearchProvider = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  // const [searchType, setSearchType] = useState('song');
  const [searchResults, setSearchResults] = useState();
  const { pageType, setPageType } = useAppContext();
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery) {
        if (pageType !== 'search') {
          setPageType('search');
        }
        var searchUrl = `https://saavn-api.nandanvarma.com/search/all?query=${searchQuery}`;

        fetch(searchUrl)
          .then((response) => response.json())
          .then((data) => {
            if (data.data) {
              setSearchResults(data.data);
            } else {
              setSearchResults([]);
            }
          })
          .catch((error) => {
            console.error('Error fetching search results:', error);
            setSearchResults([]);
          });
      } else {
        setSearchResults([]);
      }
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // useEffect(()=>{
  //   setSearchResults([]);
  //   setSearchQuery(searchQuery);
  // },[searchType]);

  return (
    <SearchContext.Provider value={{ searchQuery, setSearchQuery, searchResults, setSearchResults }}>
      {children}
    </SearchContext.Provider>
  );
};
