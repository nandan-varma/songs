import fetch from 'node-fetch';

class SaavnAPI {
  constructor() {
    this.preferredLanguages = ['Hindi'];
    this.headers = {};
    this.baseUrl = 'www.jiosaavn.com';
    this.apiStr = '/api.php?_format=json&_marker=0&api_version=4&ctx=web6dot0';
    this.endpoints = {
      homeData: '__call=webapi.getLaunchData',
      topSearches: '__call=content.getTopSearches',
      fromToken: '__call=webapi.get',
      featuredRadio: '__call=webradio.createFeaturedStation',
      artistRadio: '__call=webradio.createArtistStation',
      entityRadio: '__call=webradio.createEntityStation',
      radioSongs: '__call=webradio.getSong',
      songDetails: '__call=song.getDetails',
      playlistDetails: '__call=playlist.getDetails',
      albumDetails: '__call=content.getAlbumDetails',
      getResults: '__call=search.getResults',
      albumResults: '__call=search.getAlbumResults',
      artistResults: '__call=search.getArtistResults',
      playlistResults: '__call=search.getPlaylistResults',
      getReco: '__call=reco.getreco',
      getAlbumReco: '__call=reco.getAlbumReco',
      artistOtherTopSongs: '__call=search.artistOtherTopSongs',
    };
  }

  async getResponse(params, usev4 = true, useProxy = false) {
    let url;
    if (!usev4) {
      url = `https://${this.baseUrl}${this.apiStr}&${params.replace(
        '&api_version=4',
        ''
      )}`;
    } else {
      url = `https://${this.baseUrl}${this.apiStr}&${params}`;
    }
    const preferredLanguages = this.preferredLanguages.map((lang) =>
      lang.toLowerCase()
    );
    const languageHeader = `L=${preferredLanguages.join('%2C')}`;
    this.headers = { cookie: languageHeader, Accept: '*/*' };

    if (useProxy) {
      const settingsBox = Hive.box('settings');
      const useProxySetting = settingsBox.get('useProxy', false);
      if (useProxySetting) {
        const proxyIP = settingsBox.get('proxyIp');
        const proxyPort = settingsBox.get('proxyPort');
        const proxyUrl = `http://${proxyIP}:${proxyPort}`;
        const res = await fetch(url, {
          headers: this.headers,
          agent: new HttpsProxyAgent(proxyUrl),
        });
        return res;
      }
    }

    return fetch(url, { headers: this.headers });
  }

  async fetchHomePageData() {
    let result = {};
    try {
      const res = await this.getResponse(this.endpoints.homeData);
      if (res.status === 200) {
        const data = await res.json();
        result = await FormatResponse.formatHomePageData(data);
      }
    } catch (e) {
      console.error(`Error in fetchHomePageData: ${e}`);
    }
    return result;
  }

  async getSongFromToken(token, type, n = 10, p = 1) {
    if (n === -1) {
        const params = `token=${token}&type=${type}&n=5&p=${p}&${
            this.endpoints.fromToken
          }`;
          try {
            const res = await this.getResponse(params);
            if (res.status === 200) {
              const getMain = await res.json();
              const count = getMain['list_count'].toString();
              const songs = await FormatResponse.formatSongs(getMain, count);
              return songs;
            }
          } catch (e) {
            console.error(`Error in getSongFromToken: ${e}`);
          }
        } else {
          const songId = token.split('_')[0];
          const params = `songid=${songId}&type=${type}&n=${n}&p=${p}&${this.endpoints.fromToken}`;
          try {
            const res = await this.getResponse(params);
            if (res.status === 200) {
              const data = await res.json();
              const songs = await FormatResponse.formatSongs(data, n.toString());
              return songs;
            }
          } catch (e) {
            console.error(`Error in getSongFromToken: ${e}`);
          }
        }
        return [];
      }

      async getSongDetails(songId) {
        const params = `songid=${songId}&${this.endpoints.songDetails}`;
        try {
          const res = await this.getResponse(params);
          if (res.status === 200) {
            const data = await res.json();
            const song = await FormatResponse.formatSongDetails(data);
            return song;
          }
        } catch (e) {
          console.error(`Error in getSongDetails: ${e}`);
        }
        return null;
      }

      // Other methods...

    }

    export default SaavnAPI;
