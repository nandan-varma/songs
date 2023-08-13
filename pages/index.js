import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import LoadPage from '@/components/LoadPage';
import { useAppContext } from '@/components/AppContext';
import { Text } from '@chakra-ui/react';

const Page = () => {
  const router = useRouter();
  const {pageType, setPageType} = useAppContext();
  return (
    <LoadPage>
      <title>Music</title>
      <Text textAlign={'center'}>Try searching something</Text>
    </LoadPage>
  );
};

export default Page;
