<script>
  import MusicsTable from "./MusicsTable.svelte";
  import SearchPlaylistCard from "./SearchPlaylistCard.svelte";
  import Skeleton from "./Skeleton.svelte";
  import { searchSongs, searchPlaylists, searchAlbums, searchArtists } from "../lib/api";
  import { onMount, onDestroy } from 'svelte';

  let query = '';
  let results = { global: null, songs: null, playlists: null, albums: null, artists: null };
  let loading = { global: false, songs: false, playlists: false, albums: false, artists: false };
  let showResults = false;
  let activeTab = 'global';
  let popstateHandler;
  let searchTimeout;

  // Reactive button state
  $: isButtonDisabled = !query.trim();

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

  onMount(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      // Read initial query from URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const initialQuery = urlParams.get('q');
      if (initialQuery) {
        query = initialQuery;
        // Don't auto-search to avoid permanent loading state
        // User can click search button if they want to search again
      }

      // Handle browser back/forward navigation
      popstateHandler = (event) => {
        // Prevent auto-search on popstate if it was triggered by our own pushState
        if (event.state && event.state.fromPushState) return;

        const urlParams = new URLSearchParams(window.location.search);
        const newQuery = urlParams.get('q') || '';
        query = newQuery;
        if (newQuery) {
          performSearch(newQuery);
        } else {
          songs = [];
          playlists = [];
          showResults = false;
          isLoading = false;
        }
      };

      window.addEventListener('popstate', popstateHandler);
    }
  });

  onDestroy(() => {
    if (typeof window !== 'undefined' && popstateHandler) {
      window.removeEventListener('popstate', popstateHandler);
    }
  });

  async function performSearch(searchQuery) {
    if (!searchQuery.trim()) return;

    loading.global = true;
    try {
      // Use global search
      const response = await fetch(`https://saavn.sumit.co/api/search?query=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      if (data.success) {
        results.global = data.data;
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
    if (typeof window === 'undefined' || !query.trim()) return;

    // Update URL with query parameter
    const newUrl = new URL(window.location.href);
    if (query.trim()) {
      newUrl.searchParams.set('q', query.trim());
    } else {
      newUrl.searchParams.delete('q');
    }
    window.history.pushState({ fromPushState: true }, '', newUrl.toString());

    await performSearch(query);
  }
</script>

<div class="mb-6">
  <div class="flex gap-2">
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
      disabled={isButtonDisabled}
      class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {#if loading.global}
        Searching...
      {:else}
        Search
      {/if}
    </button>
  </div>
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
  {#if loading.global}
    <h2 class="text-2xl font-bold mb-4">Songs</h2>
    <div class="space-y-2">
      {#each Array(5) as _}
        <div class="flex items-center p-3 bg-zinc-800 rounded-md">
          <Skeleton width="40px" height="40px" className="mr-3 rounded" />
          <div class="flex-1">
            <Skeleton width="200px" height="16px" className="mb-1" />
            <Skeleton width="150px" height="12px" />
          </div>
          <Skeleton width="60px" height="16px" />
        </div>
      {/each}
    </div>
    <h2 class="text-2xl font-bold mb-4 mt-8">Albums</h2>
    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {#each Array(6) as _}
        <div>
          <div class="aspect-square mb-2 bg-zinc-800 rounded-md">
            <Skeleton width="100%" height="100%" className="rounded-md" />
          </div>
          <Skeleton width="80%" height="14px" className="mb-1" />
          <Skeleton width="60%" height="12px" />
        </div>
      {/each}
    </div>
    <h2 class="text-2xl font-bold mb-4 mt-8">Artists</h2>
    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {#each Array(6) as _}
        <div>
          <div class="aspect-square mb-2 bg-zinc-800 rounded-full">
            <Skeleton width="100%" height="100%" className="rounded-full" />
          </div>
          <Skeleton width="80%" height="14px" className="mb-1" />
          <Skeleton width="60%" height="12px" />
        </div>
      {/each}
    </div>
    <h2 class="text-2xl font-bold mb-4 mt-8">Playlists</h2>
    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {#each Array(6) as _}
        <div>
          <div class="aspect-square mb-2 bg-zinc-800 rounded-md">
            <Skeleton width="100%" height="100%" className="rounded-md" />
          </div>
          <Skeleton width="80%" height="14px" className="mb-1" />
          <Skeleton width="60%" height="12px" />
        </div>
      {/each}
    </div>
  {:else}
    {#if results.global.songs?.results?.length > 0}
      <h2 class="text-2xl font-bold mb-4">Songs</h2>
      <MusicsTable songs={results.global.songs.results.map(song => ({
        id: song.id,
        title: song.title,
        image: song.image.find(img => img.quality === '50x50')?.url || song.image[0]?.url,
        artists: song.primaryArtists ? song.primaryArtists.split(', ') : [],
        album: song.album,
        duration: ''
      }))} />
    {/if}

    {#if results.global.albums?.results?.length > 0}
      <h2 class="text-2xl font-bold mb-4 mt-8">Albums</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {#each results.global.albums.results as album}
          <a href={`/album/${album.id}`} class="group">
            <div class="aspect-square mb-2">
              <img
                src={album.image.find(img => img.quality === '500x500')?.url || album.image[0]?.url}
                alt={album.title}
                class="w-full h-full object-cover rounded-md group-hover:scale-105 transition-transform"
              />
            </div>
            <div class="text-sm font-medium truncate">{album.title}</div>
            <div class="text-xs text-gray-400 truncate">{album.artist}</div>
          </a>
        {/each}
      </div>
    {/if}

    {#if results.global.artists?.results?.length > 0}
      <h2 class="text-2xl font-bold mb-4 mt-8">Artists</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {#each results.global.artists.results as artist}
          <a href={`/artist/${artist.id}`} class="group">
            <div class="aspect-square mb-2">
              <img
                src={artist.image.find(img => img.quality === '500x500')?.url || artist.image[0]?.url}
                alt={artist.title}
                class="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform"
              />
            </div>
            <div class="text-sm font-medium truncate">{artist.title}</div>
            <div class="text-xs text-gray-400 truncate">{artist.type}</div>
          </a>
        {/each}
      </div>
    {/if}

    {#if results.global.playlists?.results?.length > 0}
      <h2 class="text-2xl font-bold mb-4 mt-8">Playlists</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {#each results.global.playlists.results as playlist}
          <a href={`/playlist/${playlist.id}`} class="group">
            <div class="aspect-square mb-2">
              <img
                src={playlist.image.find(img => img.quality === '500x500')?.url || playlist.image[0]?.url}
                alt={playlist.title}
                class="w-full h-full object-cover rounded-md group-hover:scale-105 transition-transform"
              />
            </div>
            <div class="text-sm font-medium truncate">{playlist.title}</div>
            <div class="text-xs text-gray-400 truncate">{playlist.description}</div>
          </a>
        {/each}
      </div>
    {/if}
  {/if}
  {:else if activeTab === 'songs'}
    {#if loading.songs}
      <div class="space-y-2">
        {#each Array(10) as _}
          <div class="flex items-center p-3 bg-zinc-800 rounded-md">
            <Skeleton width="40px" height="40px" className="mr-3 rounded" />
            <div class="flex-1">
              <Skeleton width="200px" height="16px" className="mb-1" />
              <Skeleton width="150px" height="12px" />
            </div>
            <Skeleton width="60px" height="16px" />
          </div>
        {/each}
      </div>
    {:else if results.songs}
      <MusicsTable songs={results.songs} />
    {/if}
   {:else if activeTab === 'playlists'}
     {#if loading.playlists}
       <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
         {#each Array(6) as _}
           <div>
             <div class="aspect-square mb-2 bg-zinc-800 rounded-md">
               <Skeleton width="100%" height="100%" className="rounded-md" />
             </div>
             <Skeleton width="80%" height="14px" className="mb-1" />
             <Skeleton width="60%" height="12px" />
           </div>
         {/each}
       </div>
     {:else if results.playlists}
       <div class="space-y-2">
         {#each results.playlists as playlist}
           <a href={`/playlist/${playlist.id}`} class="block">
             <SearchPlaylistCard {playlist} />
           </a>
         {/each}
       </div>
     {/if}
  {:else if activeTab === 'albums'}
    {#if loading.albums}
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {#each Array(12) as _}
          <div>
            <div class="aspect-square mb-2 bg-zinc-800 rounded-md">
              <Skeleton width="100%" height="100%" className="rounded-md" />
            </div>
            <Skeleton width="80%" height="14px" className="mb-1" />
            <Skeleton width="60%" height="12px" />
          </div>
        {/each}
      </div>
    {:else if results.albums}
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {#each results.albums as album}
          <a href={`/album/${album.id}`} class="group">
            <div class="aspect-square mb-2">
              <img
                src={album.image.find(img => img.quality === '500x500')?.url || album.image[0]?.url}
                alt={album.name}
                class="w-full h-full object-cover rounded-md group-hover:scale-105 transition-transform"
              />
            </div>
            <div class="text-sm font-medium truncate">{album.name}</div>
            <div class="text-xs text-gray-400 truncate">{album.artist}</div>
          </a>
        {/each}
      </div>
    {/if}
  {:else if activeTab === 'artists'}
    {#if loading.artists}
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {#each Array(6) as _}
          <div>
            <div class="aspect-square mb-2 bg-zinc-800 rounded-full">
              <Skeleton width="100%" height="100%" className="rounded-full" />
            </div>
            <Skeleton width="80%" height="14px" className="mb-1" />
            <Skeleton width="60%" height="12px" />
          </div>
        {/each}
      </div>
    {:else if results.artists}
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
    {/if}
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