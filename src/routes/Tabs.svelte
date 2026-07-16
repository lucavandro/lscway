<script>
  import { page } from "$app/stores";
  import { base } from "$app/paths";
  import { isTeacher } from "$lib/stores.js";
</script>

{#if $page.url.pathname == base + "/" || $page.url.pathname == base + "/docente" || $page.url.pathname == base + "/aula" || ($isTeacher && $page.route.id === "/sostituzioni")}
  <nav id="tabs" aria-label="Navigazione">
    <ul>
      <li>
        <a href="." class:active={$page.url.pathname === base + "/"}>Classe</a>
      </li>
      <li>
        <a
          href="docente"
          class:active={$page.url.pathname === base + "/docente"}>Docente</a
        >
      </li>
      <li>
        <a href="aula" class:active={$page.url.pathname === base + "/aula"}
          >Aula</a
        >
      </li>
      {#if $isTeacher}
        <li>
          <a
            href="sostituzioni"
            class:active={$page.route.id === "/sostituzioni"}>Sostituzioni</a
          >
        </li>
      {/if}
    </ul>
  </nav>
{/if}

<style>
  #tabs {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  #tabs ul {
    display: flex;
    list-style: none;
    padding: 0;
    margin: 0;
    width: 100%;
  }

  #tabs li {
    flex: 1;
    text-align: center;
    padding: 8px 0;
  }

  #tabs a,
  #tabs .active {
    font-weight: bold;
    border-bottom: 2px solid var(--pico-color);
    border-radius: 0;
  }
</style>
