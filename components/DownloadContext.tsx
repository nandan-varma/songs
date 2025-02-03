import React, { createContext, useState, useContext, ReactNode } from 'react';

interface DownloadContextType {
    pageType: string;
    SetPageType: React.Dispatch<React.SetStateAction<string>>;
}

const DownloadContext = createContext<DownloadContextType | undefined>(undefined);

export const useDownloadContext = (): DownloadContextType => {
    const context = useContext(DownloadContext);
    if (!context) {
        throw new Error('useDownloadContext must be used within a DownloadProvider');
    }
    return context;
};

interface DownloadProviderProps {
    children: ReactNode;
}

export const DownloadProvider: React.FC<DownloadProviderProps> = ({ children }) => {
    const [pageType, SetPageType] = useState<string>('search');

    return (
        <DownloadContext.Provider value={{ pageType, SetPageType }}>
            {children}
        </DownloadContext.Provider>
    );
};
