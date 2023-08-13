// components/Footer.jsx
import { Box, Flex, Text } from '@chakra-ui/react';

export default function Footer() {
  return (
    <Box p={4} position={'fixed'} bottom={'0'}>
      <Text mt={4} textAlign="center">
        &copy; {new Date().getFullYear()} Nandan Varma. No rights reserved.
      </Text>
    </Box>
  );
}
