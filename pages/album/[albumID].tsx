import { Center, Box, Heading, Image, Text, Flex, IconButton, VStack } from '@chakra-ui/react';
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { faPlay } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useSearchContext } from "@/components/search/SearchContext";
import { usePlayerContext } from "@/components/PlayerContext";
import DownloadIcon from "@/components/DownloadIcon";
import { api_link } from '@/lib/api';

export default function AlbumPage() {
    const router = useRouter();
    const { albumID } = router.query;
    const [albumData, setAlbumData] = useState(null);
    const { ResetSearch } = useSearchContext();
    const { handlePlay } = usePlayerContext();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (albumID) {
            fetch(`${api_link}/albums?id=${albumID}`)
                .then(response => response.json())
                .then(data => {
                    if (data.data) {
                        setAlbumData(data.data);
                    } else {
                        setAlbumData(null);
                    }
                    setLoading(false);
                })
                .catch(error => {
                    console.error('Error fetching album data:', error);
                    setAlbumData(null);
                    setLoading(false);
                });
            ResetSearch();
        }
    }, [albumID]);

    if (loading) return <Center>Loading...</Center>;

    if (!albumData) return <Center>Error loading album data.</Center>;
    return (
        <Box p={6}>
            <Flex direction="column" align="center">
                <Image src={albumData.image[2].link} alt={albumData.name} maxW="300px" mb={4} />

                <Heading as="h1" size="xl" mb={2}>
                    {albumData.name.replace(/&quot;/g,'"')}
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
                            <Flex key={result.id} align="center" w="100%">
                                {/* <Song song={result}></Song> */}
                                <Box>
                                    <Text fontSize="lg" fontWeight="semibold">
                                        {result.name.replace(/&quot;/g,'"')}
                                    </Text>
                                    <Text>
                                        {result.primaryArtists} - {result.duration} seconds
                                    </Text>
                                </Box>
                                <Flex align={'center'} direction={'row'} ml={'auto'}>
                                    <IconButton
                                        ml={'2'}
                                        onClick={() => { handlePlay(result) }}
                                        aria-label="Play Song"
                                        icon={<FontAwesomeIcon icon={faPlay} />}
                                    />
                                    <DownloadIcon id={result.id} name={result.name} />
                                </Flex>
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
