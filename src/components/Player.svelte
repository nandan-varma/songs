<script>
  import { queue, currentIndex, currentSong, isPlaying, volume, progress, duration } from '../lib/playerStore';
  import InlineArtists from './InlineArtists.svelte';
  import { SkipBack, Play, Pause, SkipForward, Volume2 } from 'lucide-svelte';

  let audio;
  let currentTime = 0;
  let totalDuration = 0;

  // Reactive progress calculation
  $: progressValue = audio && totalDuration ? (currentTime / totalDuration) * 100 : 0;

  $: if ($currentSong && audio) {
    const url = $currentSong.downloadUrl?.find(d => d.quality === '160kbps')?.url || $currentSong.downloadUrl?.[0]?.url;
    if (url) {
      console.log('Loading audio:', url);
      audio.src = url;
      audio.load();
      if ($isPlaying) {
        audio.play().catch((error) => {
          console.error('Error playing audio:', error);
        });
      }
    } else {
      console.error('No valid download URL found for song:', $currentSong);
    }
  }

  $: if (audio) {
    audio.volume = $volume;
  }

  function togglePlay() {
    if ($isPlaying) {
      audio.pause();
      isPlaying.set(false);
    } else {
      audio.play().catch(() => {});
      isPlaying.set(true);
    }
  }

  function seek(e) {
    const value = parseFloat(e.target.value);
    if (audio && totalDuration) {
      const newTime = (value / 100) * totalDuration;
      audio.currentTime = newTime;
      currentTime = newTime;
      progress.set(value);
    }
  }

  function handleTimeUpdate() {
    if (audio) {
      currentTime = audio.currentTime;
      const progressPercent = totalDuration ? (currentTime / totalDuration) * 100 : 0;
      progress.set(progressPercent);
    }
  }

  function handleLoadedMetadata() {
    if (audio) {
      totalDuration = audio.duration;
      duration.set(totalDuration);
    }
  }

  function handleEnded() {
    next(); // Auto play next
  }

  function prev() {
    if ($currentIndex > 0) {
      currentIndex.update(i => i - 1);
    }
  }

  function next() {
    if ($currentIndex < $queue.length - 1) {
      currentIndex.update(i => i + 1);
    } else {
      isPlaying.set(false); // End of queue
    }
  }

  // Update currentSong when index changes
  $: if ($queue[$currentIndex]) {
    currentSong.set($queue[$currentIndex]);
  }

  function formatTime(seconds) {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
</script>

{#if $currentSong}
  <audio
    bind:this={audio}
    on:timeupdate={handleTimeUpdate}
    on:loadedmetadata={handleLoadedMetadata}
    on:ended={handleEnded}
  ></audio>

  <div class="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-700 p-4 flex items-center z-50">
    <!-- Current song info -->
    <div class="flex items-center min-w-0 flex-1">
      <img src={$currentSong.image} alt="" class="w-12 h-12 rounded mr-4">
      <div class="min-w-0">
        <div class="text-white text-sm truncate">{$currentSong.title}</div>
        <div class="text-gray-400 text-xs truncate">
          <InlineArtists artists={$currentSong.artists} />
        </div>
      </div>
    </div>

    <!-- Controls -->
    <div class="flex flex-col items-center flex-1">
      <div class="flex items-center gap-4 mb-2">
        <button on:click={prev} class="text-gray-400 hover:text-white">
          <SkipBack size={20} />
        </button>
        <button on:click={togglePlay} class="text-white bg-green-500 rounded-full p-2 hover:bg-green-600">
          {#if $isPlaying}
            <Pause size={16} />
          {:else}
            <Play size={16} />
          {/if}
        </button>
        <button on:click={next} class="text-gray-400 hover:text-white">
          <SkipForward size={20} />
        </button>
      </div>
       <div class="flex items-center gap-2 w-full max-w-md">
         <span class="text-xs text-gray-400">{formatTime(currentTime)}</span>
         <input
           type="range"
           min="0"
           max="100"
           value={progressValue}
           on:input={seek}
           class="flex-1"
         >
         <span class="text-xs text-gray-400">{formatTime(totalDuration)}</span>
       </div>
    </div>

    <!-- Volume -->
    <div class="flex items-center gap-2 min-w-0 flex-1 justify-end">
      <Volume2 size={16} class="text-gray-400" />
      <input
        type="range"
        min="0"
        max="1"
        step="0.1"
        bind:value={$volume}
        class="w-20"
      >
    </div>
  </div>
{/if}

<style>
  input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    background: #374151;
    height: 4px;
    border-radius: 2px;
  }
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #10b981;
    cursor: pointer;
  }
</style>