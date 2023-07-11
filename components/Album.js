import React from 'react';
import { Song } from '../components/song';
import { Center, Spinner } from '@chakra-ui/react';

const AlbumPage = ({ albumData, handlePlay, handleAddToPlaylist }) => {
  return (
    <>
      {albumData !== null ? (
        <div className="album-box">
          <img
            className="background-art"
            src={albumData.image.find((img) => img.quality === "50x50").link}
            alt={albumData.name}
          />
          <h1>{albumData.name}</h1>
          <img
            className="bordered"
            src={albumData.image.find((img) => img.quality === "500x500").link}
            alt={albumData.name}
          />
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