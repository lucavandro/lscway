<script>
  import { onDestroy, onMount } from "svelte";
  import { page } from "$app/stores";
  import { getDay } from "$lib/dateutils.js";
  import { getPrefClassroom, setPrefClassroom } from "$lib/utils.js";
  import ItemSelect from "./../ItemSelect.svelte";
  import TimeTable from "./../TimeTable.svelte";
  import FullTimeTable from "./../FullTimeTable.svelte";
  import FullTimeTableSwitch from "./../FullTimeTableSwitch.svelte";

  export let data;
  let selectedClassroom = "";
  let showFullTimeTable = false;
  let currenDay = getDay();

  $: classrooms = data?.aule ? data.aule.filter((e) => e != "") : [];
  $: classroomWeekData = data?.data?.filter((e) => e.aula === selectedClassroom) || [];
  $: classroomData = classroomWeekData.filter((e) => e.day === currenDay);

  function onSelectedItemChange() {
    let queryClass = $page.url.searchParams.get("q");
    if (!queryClass || queryClass !== selectedClassroom) {
      setPrefClassroom(selectedClassroom);
    }
  }

  onMount(() => {
    let queryClass = $page.url.searchParams.get("q");
    if (queryClass && classrooms.includes(queryClass)) {
      selectedClassroom = queryClass;
    } else {
      selectedClassroom = getPrefClassroom() || classrooms[0] || "";
    }

    try {
      const saved = sessionStorage.getItem("lscway:aula:showFullTable");
      if (saved !== null) {
        showFullTimeTable = JSON.parse(saved);
      }
    } catch (e) {}
  });

  onDestroy(() => {
    try {
      sessionStorage.setItem("lscway:aula:showFullTable", JSON.stringify(showFullTimeTable));
    } catch (e) {}
  });
</script>

<svelte:head>
  <title>Orario Aula {selectedClassroom} - WAY Cortese</title>
</svelte:head>

<div class="page-container">
  <div class="toolbar-card">
    <div class="toolbar-select">
      <ItemSelect
        label="Aula"
        bind:item={selectedClassroom}
        list={classrooms}
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
        <span>Aula {selectedClassroom}</span>
        <span class="view-tag">{showFullTimeTable ? "Settimanale" : `Oggi (${currenDay})`}</span>
      </h2>
    </div>

    {#if showFullTimeTable}
      <FullTimeTable
        bind:tableData={classroomWeekData}
        fields={["classe", "docente", "materia"]}
      />
    {:else}
      <TimeTable
        bind:data={classroomData}
        fields={["classe", "docente", "materia"]}
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
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
    gap: 0.65rem;
    background: var(--brand-surface-card);
    border: 1px solid var(--brand-border);
    border-radius: 12px;
    padding: 0.55rem 0.75rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  }

  .toolbar-select {
    flex: 1;
    min-width: 0;
  }

  .toolbar-switch {
    flex-shrink: 0;
  }

  @media (min-width: 640px) {
    .page-container {
      gap: 1.25rem;
    }
    .toolbar-card {
      padding: 0.85rem 1.15rem;
      border-radius: 14px;
      gap: 1.5rem;
    }
    .toolbar-select {
      max-width: 320px;
    }
  }

  .table-section {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }

  .section-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 0.15rem;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.975rem;
    font-weight: 700;
    margin: 0;
    color: var(--brand-text);
  }

  .view-tag {
    font-size: 0.725rem;
    font-weight: 600;
    padding: 0.1rem 0.45rem;
    border-radius: 9999px;
    background: color-mix(in srgb, var(--brand-primary) 12%, transparent);
    color: var(--brand-primary);
  }
</style>
