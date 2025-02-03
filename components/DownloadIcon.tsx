import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { IconButton, Text } from '@chakra-ui/react';
import { usePlayerContext } from './PlayerContext';

interface DownloadIconProps {
  id: string;
  name: string;
  downloadUrl?: string;
}

const DownloadIcon: React.FC<DownloadIconProps> = ({ id, name, downloadUrl }) => {
  const { getDownloadUrl } = usePlayerContext();
  const [downloadProgress, setDownloadProgress] = useState(0);
  let url = downloadUrl;

  const handleDownload = async () => {
    setDownloadProgress(1);
    if (url == null || url == undefined) {
      await getDownloadUrl(id).then((res) => {
        url = res;
      })
    }
    const response = await fetch(url);
    const totalSize = response.headers.get('content-length');
    let loadedSize = 0;
    const chunks: Uint8Array[] = [];

    const reader = response.body.getReader();

    const handleChunk = ({ value, done }: { value: Uint8Array, done: boolean }) => {
      if (done) {
        const blob = new Blob(chunks, { type: response.headers.get('content-type') });
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = name;
        link.click();
        URL.revokeObjectURL(blobUrl);
        setDownloadProgress(0);
        return;
      }

      chunks.push(value);
      loadedSize += value.length;
      const progress = Math.round((loadedSize / parseInt(totalSize)) * 99);
      setDownloadProgress(progress + 1);

      return reader.read().then(handleChunk);
    };

    return reader.read().then(handleChunk);
  };

  return (
    <div className="download-icon" onClick={handleDownload}>
      {downloadProgress != 0 ? (
        <Text w={'16'} p={'2'} fontWeight={'bold'}>
          {downloadProgress}%
        </Text>
      ) : (
        <IconButton m={'1'} icon={<FontAwesomeIcon icon={faDownload} />} aria-label="Download" />
      )}
    </div>
  );
};

export default DownloadIcon;
