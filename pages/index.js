import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import LoadPage from '@/components/LoadPage';
import { useAppContext } from '@/components/AppContext';
import { Text } from '@chakra-ui/react';
import Footer from '@/components/Footer';

const Page = () => {
  const router = useRouter();
  return (
    <LoadPage>
      <title>Music</title>
      <Text textAlign={'center'}>Try searching something</Text>
      <Footer/>
    </LoadPage>
  );
};

export default Page;
