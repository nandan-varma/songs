// components/Footer.jsx
import { Box, Text } from '@chakra-ui/react';
import React from 'react';

const Footer: React.FC = () => {
  return (
    <Box p={4} position={'fixed'} bottom={'0'}>
      <Text mt={4} textAlign="center">
        &copy; {new Date().getFullYear()} Nandan Varma. No rights reserved.
      </Text>
    </Box>
  );
}

export default Footer;
