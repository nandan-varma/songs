import AlbumPage from "@/components/Album";
import { Center, Box, Heading, Image, Text, Link, Flex, IconButton, VStack } from '@chakra-ui/react';
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { faPlay, faHeadphones, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useSearchContext } from "@/components/search/SearchContext";
import { usePlayerContext } from "@/components/PlayerContext";
import { Song } from "@/components/song";

export default function album() {
    const router = useRouter();
    const { albumID } = router.query;
    const [albumData, setAlbumData] = useState(null);
    const { ResetSearch } = useSearchContext();
    const { handlePlay } = usePlayerContext();
    useEffect(() => {
        if (albumID) {
            fetch(`https://jiosaavn-api-ebon-one.vercel.app/albums?id=${albumID}`)
                .then(response => response.json())
                .then(data => {
                    if (data.data) {
                        setAlbumData(data.data);
                    } else {
                        setAlbumData(null);
                    }
                })
                .catch(error => {
                    console.error('Error fetching album data:', error);
                    setAlbumData(null);
                });
            ResetSearch();
        }
    }, [albumID]);
    if (!albumData) return <Center>Loading...</Center>;
    return (
        <Box p={6}>
            <Flex direction="column" align="center">
                <Image src={albumData.image[2].link} alt={albumData.name} maxW="300px" mb={4} />

                <Heading as="h1" size="xl" mb={2}>
                    {albumData.name}
                </Heading>
                <Text fontSize="lg" color="gray.600" mb={4}>
                    {albumData.year}
                </Text>

                <VStack spacing={4} align="flex-start">
                    {/* Songs */}
                    <Box>
                        <Heading as="h2" size="md" mb={2}>
                            Songs
                        </Heading>
                        {albumData.songs.map((result) => (
                            <Flex key={result.id} align="center" justifyContent="space-between" w="100%">
                                {/* <Song song={result}></Song> */}
                                <Box>
                                    <Text fontSize="lg" fontWeight="semibold">
                                        {result.name}
                                    </Text>
                                    <Text color="gray.600">
                                        {result.primaryArtists} - {result.duration} seconds
                                    </Text>
                                </Box>
                                <IconButton
                                    ml={'2'}
                                    onClick={()=>{handlePlay(result)}}
                                    aria-label="Play Song"
                                    icon={<FontAwesomeIcon icon={faPlay} />}
                                    colorScheme="blue"
                                    variant="outline"
                                />
                            </Flex>
                        ))}
                    </Box>

                    {/* Album Details */}
                    <Box>
                        <Heading as="h2" size="md" mb={2}>
                            Album Details
                        </Heading>
                        <Flex align="center">
                            <Text fontWeight="semibold" mr={2}>
                                Release Date:
                            </Text>
                            <Text>{albumData.releaseDate}</Text>
                        </Flex>
                        <Flex align="center">
                            <Text fontWeight="semibold" mr={2}>
                                Total Songs:
                            </Text>
                            <Text>{albumData.songCount}</Text>
                        </Flex>
                        <Flex align="center">
                            <Text fontWeight="semibold" mr={2}>
                                Primary Artist:
                            </Text>
                            <Text>{albumData.primaryArtists}</Text>
                        </Flex>
                    </Box>
                </VStack>
            </Flex>
        </Box>
    );
};
