import { api_link } from '@/lib/api';
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface Image {
  quality: string;
  link: string;
}

interface Song {
  id: string;
  title: string;
  image: Image[];
  album: string;
  url: string;
  type: string;
  description: string;
  position: number;
  primaryArtists: string;
  singers: string;
  language: string;
}

interface Album {
  id: string;
  title: string;
  image: Image[];
  artist: string;
  url: string;
  type: string;
  description: string;
  position: number;
  year: string;
  songIds: string;
  language: string;
}

interface SearchResult<T> {
  results: T[];
  position: number;
}

interface SearchResults {
  topQuery: SearchResult<any>;
  songs: SearchResult<Song>;
  albums: SearchResult<Album>;
  artists: SearchResult<any>;
  playlists: SearchResult<any>;
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

export const useSearchContext = () => {
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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResults>(emptyResult);
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