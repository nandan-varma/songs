<script>
  import InlineArtists from "./InlineArtists.svelte";
  import { queue, currentIndex, currentSong, isPlaying } from "../lib/playerStore";

  export let songs = [];

  function playSong(song) {
    queue.update(q => {
      let index = q.findIndex(s => s.id === song.id);
      if (index === -1) {
        q.push(song);
        index = q.length - 1;
      }
      currentIndex.set(index);
      return q;
    });
    currentSong.set(song);
    isPlaying.set(true);
  }
</script>

<table class="table-auto text-left min-w-full divide-y-2 divide-gray-500/30">
  <thead>
    <tr class="text-gray-300">
      <th class="font-normal px-4 py-2 whitespace-nowrap">#</th>
      <th class="font-normal px-4 py-2 whitespace-nowrap">Title</th>
      <th class="font-normal px-4 py-2 whitespace-nowrap">Album</th>
      <th class="font-normal px-4 py-2 whitespace-nowrap text-right">
        Duration
      </th>
    </tr>
  </thead>
  <tbody>
    {#each songs as song, index}
      <tr class="group hover:bg-gray-500/20">
        <td class="whitespace-nowrap px-4 py-2">
          <button on:click={() => playSong(song)} class="text-green-500 hover:text-white text-lg">▶</button>
        </td>
        <td class="whitespace-nowrap px-4 py-2 flex gap-3 items-center">
          <div class="h-10 w-10">
            <img
              src={song.image}
              alt={song.title}
              class="rounded object-cover h-full w-full shadow-[5px_0_30px_0px_rgba(0,0,0,0.3)]"
            />
          </div>
          <div class="leading-none">
            <span
              class="text-gray-300 group-hover:text-white hover:underline text-sm"
            >
              {song.title}
            </span>
            <div class="text-sm text-gray-300 group-hover:text-white">
              <InlineArtists artists={song.artists} />
            </div>
          </div>
        </td>
        <td class="whitespace-nowrap px-4 py-2">
          <span
            class="text-gray-300 group-hover:text-white hover:underline text-sm"
          >
            {song.album}
          </span>
        </td>
        <td class="whitespace-nowrap px-4 py-2 text-right">
          {song.duration}
        </td>
      </tr>
    {/each}
  </tbody>
</table>