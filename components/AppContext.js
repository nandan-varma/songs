import React, { createContext, useState, useContext } from 'react';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
    const [pageType, SetPageType] = useState('search');

    return (
        <AppContext.Provider value={{ pageType, SetPageType}}>
            {children}
        </AppContext.Provider>
    );
};
