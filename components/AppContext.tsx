import React, { createContext, useState, useContext, ReactNode } from 'react';

interface AppContextType {
    pageType: string;
    SetPageType: React.Dispatch<React.SetStateAction<string>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = (): AppContextType => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};

interface AppProviderProps {
    children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
    const [pageType, SetPageType] = useState<string>('search');

    return (
        <AppContext.Provider value={{ pageType, SetPageType }}>
            {children}
        </AppContext.Provider>
    );
};
