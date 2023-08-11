// components/Footer.jsx
import { Box, Flex, Link, Text } from '@chakra-ui/react';
import NextLink from 'next/link';

export default function Footer() {
  return (
    <Box as="footer"p={4} mt="auto">
      {/* <Flex align="center" justify="center">
        <NextLink href="/privacy-policy">
          <Link mr={4}>Privacy Policy</Link>
        </NextLink>
        <NextLink href="/terms-of-service">
          <Link>Terms of Service</Link>
        </NextLink>
      </Flex> */}
      <Text mt={4} textAlign="center">
        &copy; {new Date().getFullYear()} Nandan Varma. No rights reserved.
      </Text>
    </Box>
  );
}
