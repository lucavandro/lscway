<script>
    let isLoading = false;
    function reload(){
        isLoading = true
        setTimeout(()=>location.reload(), 1000)
        
    }
    import {userEmail} from "$lib/stores.js"

</script>
{#if isLoading}
<div class="container">
    <progress />
</div>
{:else}
<div><button on:click={reload}>↻</button></div>
{/if}

<footer>
    <div><p>{$userEmail}</p>
        <p>Developed with 💙 by Liceo Scientifico Cortese</p>
    </div>
</footer>

<style>
    footer {
        position: relative;
        left: 0;
        bottom: 0;
        width: 100%;
        padding: 12px;
    }

    footer p {
        max-width: fit-content;
        margin: auto;
        padding: 6px 0;
    }

    div {
        text-align: center;
    }
</style>
