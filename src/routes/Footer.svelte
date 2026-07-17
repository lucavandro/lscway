<script> 
 import {isLoading} from "$lib/stores.js";
</script>



<footer>
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
    background-color:none;
    padding:0;
    margin-bottom:-5px;
  }

  progress{
    margin-bottom: 0;
  }


   
</style>
