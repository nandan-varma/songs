import { api_link } from '../../lib/api';
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface SearchResult {
  results: any[];
  position: number;
}

interface SearchResults {
  topQuery: SearchResult;
  songs: SearchResult;
  albums: SearchResult;
  artists: SearchResult;
  playlists: SearchResult;
}

interface SearchContextType {
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  searchResults: SearchResults;
  setSearchResults: React.Dispatch<React.SetStateAction<SearchResults>>;
  emptyResult: SearchResults;
  ResetSearch: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const useSearchContext = (): SearchContextType => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearchContext must be used within a SearchProvider');
  }
  return context;
};

interface SearchProviderProps {
  children: ReactNode;
}

export const SearchProvider: React.FC<SearchProviderProps> = ({ children }) => {
  const emptyResult: SearchResults = {
    topQuery: {
      results: [],
      position: 0
    },
    songs: {
      results: [],
      position: 1
    },
    albums: {
      results: [],
      position: 2
    },
    artists: {
      results: [],
      position: 3
    },
    playlists: {
      results: [],
      position: 4
    }
  };

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResults>(emptyResult);

  const ResetSearch = () => {
    setSearchQuery('');
    setSearchResults(emptyResult);
  };

  useEffect(() => {
    if (searchQuery && searchQuery.replace(/\s/g, "") !== "") {
      const searchUrl = `${api_link}/search/all?query=${searchQuery}`;

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
