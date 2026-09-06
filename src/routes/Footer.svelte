<script>
  import { isLoading } from "$lib/stores.js";
</script>

<footer>
  <small>A.S. 2026/27</small>
  {#if $isLoading}
    <progress />
  {/if}
</footer>

<style>
  footer {
    position: fixed;
    left: 0;
    bottom: 0;
    width: 100%;
    background-color: none;
    padding: 0;
    margin-bottom: -5px;
  }

  footer small {
    text-align: center;
    margin-bottom: 0;
    margin: auto;
    display: block;
    padding: 1rem;
  }

  progress {
    margin-bottom: 0;
  }
</style>
