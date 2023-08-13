import React, { createContext, useState, useContext, useEffect } from 'react';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
    const [history, setHistory] = useState([]);
    const [pageType, SetPageType] = useState('search');
    const [content, SetContent] = useState({ type: "song", id: 0 })
    const [data, SetData] = useState([]);

    // useEffect(() => {
    //     var delayDebounceFn;
    //     delayDebounceFn = setTimeout(() => {
    //         SetData([]);
    //             fetch(`${}/${data.type}s?id=${data.id}`)
    //                 .then((response) => response.json())
    //                 .then((res) => {
    //                     if (res.data) {
    //                         SetData(res.data);
    //                     } else {
    //                         SetData([]);
    //                     }
    //                 })
    //                 .catch((error) => {
    //                     console.error('Error fetching album data:', error);
    //                     SetData([]);
    //                 });
    //         }, 500);

    //     return () => clearTimeout(delayDebounceFn)
    // }, [data]);

    return (
        <AppContext.Provider value={{ pageType, SetPageType}}>
            {children}
        </AppContext.Provider>
    );
};
