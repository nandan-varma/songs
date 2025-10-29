<script>
  export let artists = [];
</script>

{#each artists as artist, index}
  <span class="hover:underline">{artist}</span>
  {#if index !== artists.length - 1}
    <span class="text-gray-300">, </span>
  {/if}
{/each}