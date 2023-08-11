import React from 'react';
import { Song } from '../components/song';
import { Grid, Center, Spinner, Text, Heading } from '@chakra-ui/react';

const AlbumPage = ({ albumData, handlePlay, handleAddToPlaylist }) => {
  return (
    <>
      {albumData !== null ? (
        <div className="album-box">
          <Center>
          <Text as={Heading}>{albumData.name}</Text>
          </Center>
          <Center>
          <img
            className="bordered"
            src={albumData.image.find((img) => img.quality === "500x500").link}
            alt={albumData.name}
            />
            </Center>
  <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={4}>
            {albumData.songs.map((song) => (
              <Song
                key={song.id}
                song={song}
                onPlay={handlePlay}
                onAddToPlaylist={handleAddToPlaylist}
              />
            ))}
          </Grid>
        </div>
      ) : (
        <Center mt={"50vh"}>
          <Spinner size={"xl"}></Spinner>
        </Center>)}
    </>
  );
};

export default AlbumPage;