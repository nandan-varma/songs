import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { Text } from '@chakra-ui/react';

const DownloadIcon = ({ id, name, downloadUrl }) => {
  const [downloadProgress, setDownloadProgress] = useState(0);
  var url;



  const handleDownload = async () => {
    url = downloadUrl;
    if (url == null || url == undefined) {
      const url_response = await fetch(`https://saavn-api.nandanvarma.com/songs?id=${id}`).then((res)=>{
        return res.json();
      });
      url = url_response.data[0].downloadUrl[4].link;
    }
    const response = await fetch(url);
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
      {downloadProgress != 0 ? (
        <Text fontWeight={'bold'} size={'2x'}>
          {downloadProgress}%
        </Text>
      ) : (
        <FontAwesomeIcon size='2x' icon={faDownload} />
      )}
    </div>
  );
};

export default DownloadIcon;
