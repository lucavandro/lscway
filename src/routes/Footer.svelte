<script>
    let isLoading = false;
    function reload(){
        isLoading = true
        setTimeout(()=>location.reload(), 1000)
        
    }
</script>
{#if isLoading}
<div class="container">
    <progress />
</div>
{:else}
<div><button on:click={reload}>↻</button></div>
{/if}

<footer>
    <div>
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

    a {
        font-size: xx-large;
        text-decoration: none;
        transform: rotate(90deg);
        display: block;
        width: fit-content;
        margin: auto;
    }
    a:hover {
        text-decoration: none;
    }

    div {
        text-align: center;
    }
</style>
