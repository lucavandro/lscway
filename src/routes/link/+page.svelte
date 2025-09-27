<div class="text-center">
    <img src="/app/way/tmp/qr.png" alt="">
    {#if canShare}
    <button on:click={share}>Condividi</button>
    <a role="button" href="{appURL}qr.png" download="QR_WAY_CORTES.png">Scarica QR Code</a>
    {:else}
    <input type="text" readonly value="https://www.liceoscientificocortese.edu.it/app/way/tmp/">
     <button on:click="{() => {navigator.clipboard.writeText('https://www.liceoscientificocortese.edu.it/app/way/tmp/'); showIns = true;}}">Copia link</button>
        {#if showIns}
        <ins>Link copiato negli appunti!</ins>
        {/if}
     {/if}
     
</div>


<script>
    let showIns = false;
    const canShare = navigator.share !== undefined;
    const appURL = "https://www.liceoscientificocortese.edu.it/app/way/tmp/";
    function share() {
    if (navigator.share) {
      navigator.share({
        title: "Way Cortese",
        text: "Accedi all'app WAY Cortese",
        url: appURL
      });
    } else {
      alert("La condivisione nativa non è supportata su questo browser.");
    }
  }

</script>
<style>
    button,
    [role=button],
    img {
        width:350px;
        height: auto;
        margin: 5px auto;
        display: block;
    }

</style>