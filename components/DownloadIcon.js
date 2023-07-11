import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { Text } from '@chakra-ui/react';

const DownloadIcon = ({ downloadUrl, name }) => {
  const [downloadProgress, setDownloadProgress] = useState(0);

  const handleDownload = async () => {
    const response = await fetch(downloadUrl);
    const totalSize = response.headers.get('content-length');
    let loadedSize = 0;
    const chunks = [];

    const reader = response.body.getReader();

    const handleChunk = ({ value, done }) => {
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
      const progress = Math.round((loadedSize / totalSize) * 100);
      setDownloadProgress(progress);

      // Read the next chunk
      return reader.read().then(handleChunk);
    };

    return reader.read().then(handleChunk);
  };

  return (
    
    <div className="download-icon" onClick={handleDownload}>
      {downloadProgress!=0 ? (
        <Text size={'2x'}>
        {downloadProgress}%
      </Text>
      ) : (
        <FontAwesomeIcon size='2x' icon={faDownload} />
      )}
    </div>
  );
};

export default DownloadIcon;