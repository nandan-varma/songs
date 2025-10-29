<script>
  import MusicsTable from "./MusicsTable.svelte";
  import SearchPlaylistCard from "./SearchPlaylistCard.svelte";
  import { searchSongs, searchPlaylists, searchAlbums, searchArtists } from "../lib/api";

  let query = '';
  let songs = [];
  let playlists = [];
  let albums = [];
  let artists = [];
  let showResults = false;
  let isLoading = false;
  let activeTab = 'songs';

  // Update query function
  function updateQuery(value) {
    query = value;
  }

  async function handleSubmit() {
    if (isLoading || !query.trim()) return;

    isLoading = true;
    try {
      // Search for songs, playlists, albums, and artists in parallel
      const [songsResult, playlistsResult, albumsResult, artistsResult] = await Promise.all([
        searchSongs(query),
        searchPlaylists(query),
        searchAlbums(query),
        searchArtists(query)
      ]);

      songs = songsResult;
      playlists = playlistsResult;
      albums = albumsResult;
      artists = artistsResult;
      showResults = songs.length > 0 || playlists.length > 0 || albums.length > 0 || artists.length > 0;

      // Default to songs tab if songs exist, otherwise playlists, then albums, then artists
      if (songs.length > 0) {
        activeTab = 'songs';
      } else if (playlists.length > 0) {
        activeTab = 'playlists';
      } else if (albums.length > 0) {
        activeTab = 'albums';
      } else if (artists.length > 0) {
        activeTab = 'artists';
      }
    } catch (error) {
      console.error('Search failed:', error);
      songs = [];
      playlists = [];
      albums = [];
      artists = [];
      showResults = false;
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="flex gap-2 mb-6">
  <input
    type="text"
    value={query}
    placeholder="Search for songs and playlists..."
    class="flex-1 px-4 py-2 bg-zinc-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
    disabled={isLoading}
    on:input={(e) => updateQuery(e.target.value)}
    on:keydown={(e) => {
      if (e.key === 'Enter' && !isLoading && query.trim()) {
        handleSubmit();
      }
    }}
  />
  <button
    on:click={handleSubmit}
    disabled={!query.trim()}
    class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {#if isLoading}
      Searching...
    {:else}
      Search
    {/if}
  </button>
</div>

{#if isLoading}
  <div class="text-center py-8">
    <div class="text-gray-400">Searching...</div>
  </div>
{:else if showResults}
  <!-- Tabs -->
  <div class="flex border-b border-zinc-700 mb-6">
    {#if songs.length > 0}
      <button
        on:click={() => activeTab = 'songs'}
        class="px-4 py-2 border-b-2 transition-colors {activeTab === 'songs' ? 'border-green-500 text-green-500' : 'border-transparent text-gray-400 hover:text-white'}"
      >
        Songs ({songs.length})
      </button>
    {/if}
    {#if playlists.length > 0}
      <button
        on:click={() => activeTab = 'playlists'}
        class="px-4 py-2 border-b-2 transition-colors {activeTab === 'playlists' ? 'border-green-500 text-green-500' : 'border-transparent text-gray-400 hover:text-white'}"
      >
        Playlists ({playlists.length})
      </button>
    {/if}
    {#if albums.length > 0}
      <button
        on:click={() => activeTab = 'albums'}
        class="px-4 py-2 border-b-2 transition-colors {activeTab === 'albums' ? 'border-green-500 text-green-500' : 'border-transparent text-gray-400 hover:text-white'}"
      >
        Albums ({albums.length})
      </button>
    {/if}
    {#if artists.length > 0}
      <button
        on:click={() => activeTab = 'artists'}
        class="px-4 py-2 border-b-2 transition-colors {activeTab === 'artists' ? 'border-green-500 text-green-500' : 'border-transparent text-gray-400 hover:text-white'}"
      >
        Artists ({artists.length})
      </button>
    {/if}
  </div>

  <!-- Results -->
  {#if activeTab === 'songs' && songs.length > 0}
    <MusicsTable songs={songs} />
  {:else if activeTab === 'playlists' && playlists.length > 0}
    <div class="space-y-2">
      {#each playlists as playlist}
        <SearchPlaylistCard {playlist} />
      {/each}
    </div>
  {:else if activeTab === 'albums' && albums.length > 0}
    <div class="space-y-2">
      {#each albums as album}
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
  {:else if activeTab === 'artists' && artists.length > 0}
    <div class="space-y-2">
      {#each artists as artist}
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
{:else if query && !showResults}
  <div class="text-center py-8">
    <div class="text-gray-400">No results found for "{query}"</div>
  </div>
{/if}