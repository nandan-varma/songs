<script>
  export let artists = [];
</script>

{#each artists as a, index}
  <span class="hover:underline">{a}</span>
  {#if index !== artists.length - 1}
    <span class="text-gray-300">, </span>
  {/if}
{/each}