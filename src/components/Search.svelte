<script>
  import MusicsTable from "./MusicsTable.svelte";
  import SearchPlaylistCard from "./SearchPlaylistCard.svelte";
  import { searchSongs, searchPlaylists, searchAlbums, searchArtists, globalSearch } from "../lib/api";

  let query = '';
  let results = { global: null, songs: null, playlists: null, albums: null, artists: null };
  let loading = { global: false, songs: false, playlists: false, albums: false, artists: false };
  let showResults = false;
  let activeTab = 'global';
  let searchTimeout;

  // Load tab data when tab changes
  $: if (activeTab !== 'global' && !results[activeTab] && !loading[activeTab] && query.trim()) {
    loadTabData(activeTab);
  }

  // Update query function with debounced search
  function updateQuery(value) {
    query = value;
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      if (query.trim()) {
        performSearch(query.trim());
      } else {
        resetResults();
      }
    }, 500); // 500ms debounce
  }

  function resetResults() {
    results = { global: null, songs: null, playlists: null, albums: null, artists: null };
    loading = { global: false, songs: false, playlists: false, albums: false, artists: false };
    showResults = false;
    activeTab = 'global';
  }

  async function performSearch(searchQuery) {
    if (!searchQuery.trim()) return;

    loading.global = true;
    try {
      const data = await globalSearch(searchQuery);
      if (data) {
        results.global = data;
        showResults = true;
        activeTab = 'global';
      }
    } catch (error) {
      console.error('Global search failed:', error);
    } finally {
      loading.global = false;
    }
  }

  async function loadTabData(tab) {
    if (results[tab] || loading[tab]) return;

    loading[tab] = true;
    try {
      let data;
      if (tab === 'songs') {
        data = await searchSongs(query);
        results.songs = data;
      } else if (tab === 'playlists') {
        data = await searchPlaylists(query);
        results.playlists = data;
      } else if (tab === 'albums') {
        data = await searchAlbums(query);
        results.albums = data;
      } else if (tab === 'artists') {
        data = await searchArtists(query);
        results.artists = data;
      }
    } catch (error) {
      console.error(`${tab} search failed:`, error);
    } finally {
      loading[tab] = false;
    }
  }

  async function handleSubmit() {
    if (!query.trim()) return;
    await performSearch(query.trim());
  }
</script>

<div class="flex gap-2 mb-6">
    <input
      type="text"
      value={query}
      placeholder="Search for songs and playlists..."
      class="flex-1 px-4 py-2 bg-zinc-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
      disabled={loading.global}
      on:input={(e) => updateQuery(e.target.value)}
      on:keydown={(e) => {
        if (e.key === 'Enter' && !loading.global && query.trim()) {
          handleSubmit();
        }
      }}
    />
    <button
      on:click={handleSubmit}
      disabled={!query.trim()}
      class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {#if loading.global}
        Searching...
      {:else}
        Search
      {/if}
    </button>
</div>

 {#if loading.global}
   <div class="text-center py-8">
     <div class="text-gray-400">Searching...</div>
   </div>
{:else if showResults}
  <!-- Tabs -->
  <div class="flex border-b border-zinc-700 mb-6">
    {#if results.global}
      <button
        on:click={() => activeTab = 'global'}
        class="px-4 py-2 border-b-2 transition-colors {activeTab === 'global' ? 'border-green-500 text-green-500' : 'border-transparent text-gray-400 hover:text-white'}"
      >
        All
      </button>
    {/if}
    <button
      on:click={() => activeTab = 'songs'}
      class="px-4 py-2 border-b-2 transition-colors {activeTab === 'songs' ? 'border-green-500 text-green-500' : 'border-transparent text-gray-400 hover:text-white'}"
    >
      Songs {results.songs ? `(${results.songs.length})` : loading.songs ? '(...)' : ''}
    </button>
    <button
      on:click={() => activeTab = 'playlists'}
      class="px-4 py-2 border-b-2 transition-colors {activeTab === 'playlists' ? 'border-green-500 text-green-500' : 'border-transparent text-gray-400 hover:text-white'}"
    >
      Playlists {results.playlists ? `(${results.playlists.length})` : loading.playlists ? '(...)' : ''}
    </button>
    <button
      on:click={() => activeTab = 'albums'}
      class="px-4 py-2 border-b-2 transition-colors {activeTab === 'albums' ? 'border-green-500 text-green-500' : 'border-transparent text-gray-400 hover:text-white'}"
    >
      Albums {results.albums ? `(${results.albums.length})` : loading.albums ? '(...)' : ''}
    </button>
    <button
      on:click={() => activeTab = 'artists'}
      class="px-4 py-2 border-b-2 transition-colors {activeTab === 'artists' ? 'border-green-500 text-green-500' : 'border-transparent text-gray-400 hover:text-white'}"
    >
      Artists {results.artists ? `(${results.artists.length})` : loading.artists ? '(...)' : ''}
    </button>
  </div>

  <!-- Results -->
  {#if activeTab === 'global' && results.global}
    {#if results.global.topQuery?.results?.length > 0}
      <div class="mb-8">
        <h2 class="text-2xl font-bold mb-4">Top Result</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {#each results.global.topQuery.results as item}
            {#if item.type === 'artist'}
              <a href={`/artist/${item.id}`} class="group">
                <div class="aspect-square mb-2">
                  <img
                    src={item.image?.find(img => img.quality === '500x500')?.url || item.image?.[0]?.url}
                    alt={item.title}
                    class="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform"
                  />
                </div>
                <div class="text-sm font-medium truncate">{item.title}</div>
                <div class="text-xs text-gray-400 truncate">{item.description}</div>
              </a>
            {:else if item.type === 'song'}
              <!-- Handle song -->
            {:else}
              <div class="p-4 bg-zinc-800 rounded-md">
                <div class="text-white">{item.title}</div>
                <div class="text-gray-400 text-sm">{item.description}</div>
              </div>
            {/if}
          {/each}
        </div>
      </div>
    {/if}
    {#if results.global.songs?.results?.length > 0}
      <div class="mb-8">
        <h2 class="text-2xl font-bold mb-4">Songs</h2>
        <MusicsTable songs={results.global.songs.results.map(song => ({
          id: song.id,
          title: song.title,
          image: song.image.find(img => img.quality === '50x50')?.url || song.image[0]?.url,
          artists: song.primaryArtists ? song.primaryArtists.split(', ') : [],
          album: song.album,
          duration: ''
        }))} />
      </div>
    {/if}
    {#if results.global.albums?.results?.length > 0}
      <div class="mb-8">
        <h2 class="text-2xl font-bold mb-4">Albums</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {#each results.global.albums.results as album}
            <a href={`/album/${album.id}`} class="group">
              <div class="aspect-square mb-2">
                <img
                  src={album.image?.find(img => img.quality === '500x500')?.url || album.image?.[0]?.url}
                  alt={album.title}
                  class="w-full h-full object-cover rounded-md group-hover:scale-105 transition-transform"
                />
              </div>
              <div class="text-sm font-medium truncate">{album.title}</div>
              <div class="text-xs text-gray-400 truncate">{album.artist}</div>
            </a>
          {/each}
        </div>
      </div>
    {/if}
    {#if results.global.artists?.results?.length > 0}
      <div class="mb-8">
        <h2 class="text-2xl font-bold mb-4">Artists</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {#each results.global.artists.results as artist}
            <a href={`/artist/${artist.id}`} class="group">
              <div class="aspect-square mb-2">
                <img
                  src={artist.image?.find(img => img.quality === '500x500')?.url || artist.image?.[0]?.url}
                  alt={artist.title}
                  class="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform"
                />
              </div>
              <div class="text-sm font-medium truncate">{artist.title}</div>
              <div class="text-xs text-gray-400 truncate">{artist.description}</div>
            </a>
          {/each}
        </div>
      </div>
    {/if}
    {#if results.global.playlists?.results?.length > 0}
      <div class="mb-8">
        <h2 class="text-2xl font-bold mb-4">Playlists</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {#each results.global.playlists.results as playlist}
            <a href={`/playlist/${playlist.id}`} class="group">
              <div class="aspect-square mb-2">
                <img
                  src={playlist.image?.find(img => img.quality === '500x500')?.url || playlist.image?.[0]?.url}
                  alt={playlist.title}
                  class="w-full h-full object-cover rounded-md group-hover:scale-105 transition-transform"
                />
              </div>
              <div class="text-sm font-medium truncate">{playlist.title}</div>
              <div class="text-xs text-gray-400 truncate">{playlist.description}</div>
            </a>
          {/each}
        </div>
      </div>
    {/if}
  {:else if activeTab === 'songs' && results.songs}
    <MusicsTable songs={results.songs} />
  {:else if activeTab === 'playlists' && results.playlists}
    <div class="space-y-2">
      {#each results.playlists as playlist}
        <SearchPlaylistCard {playlist} />
      {/each}
    </div>
  {:else if activeTab === 'albums' && results.albums}
    <div class="space-y-2">
      {#each results.albums as album}
        <a href={`/album/${album.id}`} class="block">
          <div class="flex items-center gap-3 p-3 bg-zinc-800 rounded-md hover:bg-zinc-700 transition-colors">
            <img src={album.image.find(img => img.quality === '50x50')?.url || album.image[0]?.url} alt={album.name} class="w-12 h-12 rounded" />
            <div>
              <div class="text-white">{album.name}</div>
              <div class="text-gray-400 text-sm">{album.artists?.primary?.[0]?.name}</div>
            </div>
          </div>
        </a>
      {/each}
    </div>
  {:else if activeTab === 'artists' && results.artists}
    <div class="space-y-2">
      {#each results.artists as artist}
        <a href={`/artist/${artist.id}`} class="block">
          <div class="flex items-center gap-3 p-3 bg-zinc-800 rounded-md hover:bg-zinc-700 transition-colors">
            <img src={artist.image.find(img => img.quality === '50x50')?.url || artist.image[0]?.url} alt={artist.name} class="w-12 h-12 rounded-full" />
            <div>
              <div class="text-white">{artist.name}</div>
              <div class="text-gray-400 text-sm">{artist.role}</div>
            </div>
          </div>
        </a>
      {/each}
    </div>
  {:else if loading[activeTab]}
    <div class="text-center py-8">
      <div class="text-gray-400">Loading...</div>
    </div>
  {/if}
{:else if query && !showResults}
  <div class="text-center py-8">
    <div class="text-gray-400">No results found for "{query}"</div>
  </div>
{/if}