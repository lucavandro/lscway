<script>
  let showIns = false;
  const canShare = navigator.share !== undefined;
  const appURL = "https://www.liceoscientificocortese.edu.it/app/way/tmp/";
  function share() {
    if (navigator.share) {
      navigator.share({
        title: "Way Cortese",
        text: "Accedi all'app WAY Cortese",
        url: appURL,
      });
    } else {
      alert("La condivisione nativa non è supportata su questo browser.");
    }
  }
</script>

<div class="content">
  <h6 class="">QR Code WAY Cortese</h6>
  <img src="/app/way/tmp/qr.png" alt="" />
  <div class="btn-group">
    <a role="button" href="{appURL}qr.png" download="QR_WAY_CORTESE.png"
      >Scarica QR Code</a
    >
    {#if canShare}
      <button on:click={share}>Condividi</button>
    {/if}
  </div>

  <label for="app-link">Link WAY Cortese</label>
  <fieldset role="group">
    <input
      type="text"
      name="app-link"
      value="https://www.liceoscientificocortese.edu.it/app/way/tmp/"
    />
    <button
      on:click={() => {
        navigator.clipboard.writeText(
          "https://www.liceoscientificocortese.edu.it/app/way/tmp/"
        );
        showIns = true;
      }}>Copia</button
    >
  </fieldset>
  {#if showIns}
    <ins>Link copiato negli appunti!</ins>
  {/if}
</div>

<style>
  .btn-group {
    display: grid;
    gap: 10px;
    margin: 10px 0;
  }

  .content{
    max-width: 400px;
    display: grid;
    align-items: center;
    justify-content: center;
    margin: auto;
  }
  img{
    border-radius: 5px;
  }

  h6 {
    text-align: center;
  }
</style>
