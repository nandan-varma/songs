import React, { useState, useEffect, ReactNode } from 'react';
import { Center, Spinner } from '@chakra-ui/react';

interface LoadPageProps {
    children: ReactNode;
}

const LoadPage: React.FC<LoadPageProps> = ({ children }) => {
    const [domLoaded, setDomLoaded] = useState(false);

    useEffect(() => {
        setDomLoaded(true);
    }, []);

    return (
        <>
            {
                domLoaded ? (
                    <>{children}</>
                ) : (
                    <Center mt={"50vh"}>
                        <Spinner size={"xl"}></Spinner>
                    </Center>
                )
            }
        </>
    )
};

export default LoadPage;
