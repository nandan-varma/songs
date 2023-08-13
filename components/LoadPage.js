import React, { useState, useEffect } from 'react';
import { Center, Spinner } from '@chakra-ui/react'; // Replace 'your-ui-library' with the actual library you're using

const LoadPage = ({ children }) => {
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
