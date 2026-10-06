<script>
  import { onDestroy, onMount } from "svelte";
  import { getHourNum, getDay } from "$lib/dateutils.js";
  import ItemSelect from "./ItemSelect.svelte";
  import { getPrefClass, setPrefClass } from "$lib/utils.js";
  import { page } from "$app/stores";
  import TimeTable from "./TimeTable.svelte";
  import FullTimeTable from "./FullTimeTable.svelte";
  import FullTimeTableSwitch from "./FullTimeTableSwitch.svelte";

  export let data;
  export let params = undefined;
  let currentHour;
  let currenDay = getDay();
  let selectedClass = "";
  let showFullTimeTable = false;
  let interval;

  $: classes = data?.classi ? data.classi.filter((e) => e != "") : [];
  $: classWeekData = data?.data?.filter((e) => e.classe === selectedClass && e.materia != "INCL") || [];
  $: classData = classWeekData.filter((e) => e.day === currenDay);

  function onSelectedItemChange() {
    let queryClass = $page.url.searchParams.get("q");
    if (!queryClass || queryClass !== selectedClass) {
      setPrefClass(selectedClass);
    }
  }

  onMount(() => {
    let queryClass = $page.url.searchParams.get("q");
    if (queryClass && data?.classi?.includes(queryClass)) {
      selectedClass = queryClass;
    } else {
      selectedClass = getPrefClass() || classes[0] || "";
    }

    interval = setInterval(() => {
      currenDay = getDay();
      currentHour = getHourNum();
    }, 1000);

    try {
      const saved = sessionStorage.getItem("lscway:classe:showFullTable");
      if (saved !== null) {
        showFullTimeTable = JSON.parse(saved);
      }
    } catch (e) {}
  });

  onDestroy(() => {
    if (interval) clearInterval(interval);
    try {
      sessionStorage.setItem("lscway:classe:showFullTable", JSON.stringify(showFullTimeTable));
    } catch (e) {}
  });
</script>

<svelte:head>
  <title>Orario Classe {selectedClass} - WAY Cortese</title>
</svelte:head>

<div class="page-container">
  <div class="toolbar-card">
    <div class="toolbar-select">
      <ItemSelect
        label="Classe"
        bind:item={selectedClass}
        list={classes}
        onChange={onSelectedItemChange}
      />
    </div>
    <div class="toolbar-switch">
      <FullTimeTableSwitch bind:control={showFullTimeTable} />
    </div>
  </div>

  <div class="table-section">
    {#if showFullTimeTable}
      <FullTimeTable
        bind:tableData={classWeekData}
        fields={["materia", "docente", "aula"]}
      />
    {:else}
      <TimeTable
        bind:data={classData}
        fields={["aula", "docente", "materia"]}
        day={currenDay}
      />
    {/if}
  </div>
</div>

<style>
  .page-container {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    animation: fade-in 0.2s ease-out;
  }

  .toolbar-card {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    gap: 0.6rem;
    background: var(--brand-surface-card);
    border: 1px solid var(--brand-border);
    border-radius: 12px;
    padding: 0.7rem 0.8rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  }

  .toolbar-select {
    width: 100%;
    min-width: 0;
  }

  .toolbar-switch {
    width: 100%;
  }

  @media (min-width: 640px) {
    .page-container {
      gap: 1.25rem;
    }
    .toolbar-card {
      flex-direction: row;
      align-items: flex-end;
      justify-content: space-between;
      padding: 0.85rem 1.15rem;
      border-radius: 14px;
      gap: 1.5rem;
    }
    .toolbar-select {
      flex: 1;
      max-width: 320px;
    }
    .toolbar-switch {
      width: auto;
      flex-shrink: 0;
    }
  }

  .table-section {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }
</style>
