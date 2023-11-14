import React, { createContext, useState, useContext } from 'react';

const DownloadContext = createContext();

export const useDownloadContext = () => useContext(DownloadContext);

export const DownloadProvider = ({ children }) => {
    const [pageType, SetPageType] = useState('search');

    return (
        <DownloadContext.Provider value={{ pageType, SetPageType}}>
            {children}
        </DownloadContext.Provider>
    );
};
