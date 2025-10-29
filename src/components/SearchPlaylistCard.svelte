<script>
  export let playlist;
</script>

<div class="flex items-center p-3 hover:bg-zinc-500/10 rounded-md group">
  <div class="flex-shrink-0 w-12 h-12 mr-3">
    <img
      src={playlist.image}
      alt={playlist.name}
      class="w-full h-full object-cover rounded-md"
    />
  </div>
  <div class="flex-1 min-w-0">
    <div class="text-white font-medium truncate group-hover:text-green-400">
      {playlist.name}
    </div>
    <div class="text-gray-400 text-sm">
      Playlist • {playlist.songCount ? `${playlist.songCount} songs` : 'Various songs'}
    </div>
  </div>
</div>