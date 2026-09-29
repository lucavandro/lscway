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
    <div class="section-meta">
      <h2 class="section-title">
        <span>Classe {selectedClass}</span>
        <span class="view-tag">{showFullTimeTable ? "Settimanale" : `Oggi (${currenDay})`}</span>
      </h2>
    </div>

    {#if showFullTimeTable}
      <FullTimeTable
        bind:tableData={classWeekData}
        fields={["materia", "docente", "aula"]}
      />
    {:else}
      <TimeTable
        bind:data={classData}
        fields={["aula", "docente", "materia"]}
      />
    {/if}
  </div>
</div>

<style>
  .page-container {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    animation: fade-in 0.2s ease-out;
  }

  .toolbar-card {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    background: var(--brand-surface-card);
    border: 1px solid var(--brand-border);
    border-radius: 14px;
    padding: 1.15rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  }

  @media (min-width: 640px) {
    .toolbar-card {
      flex-direction: row;
      align-items: flex-end;
      justify-content: space-between;
      gap: 1.5rem;
    }
    .toolbar-select {
      flex: 1;
      max-width: 320px;
    }
  }

  .table-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .section-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 0.25rem;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 1.1rem;
    font-weight: 700;
    margin: 0;
    color: var(--brand-text);
  }

  .view-tag {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.15rem 0.5rem;
    border-radius: 9999px;
    background: color-mix(in srgb, var(--brand-primary) 12%, transparent);
    color: var(--brand-primary);
  }
</style>
