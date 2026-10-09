<script>
  import { onDestroy, onMount } from "svelte";
  import { page } from "$app/stores";
  import { clockStore } from "$lib/dateutils.js";
  import { getPrefClassroom, setPrefClassroom } from "$lib/utils.js";
  import { timetableData } from "$lib/stores.js";
  import ItemSelect from "./../ItemSelect.svelte";
  import TimeTable from "./../TimeTable.svelte";
  import FullTimeTable from "./../FullTimeTable.svelte";
  import FullTimeTableSwitch from "./../FullTimeTableSwitch.svelte";

  export let data;
  let selectedClassroom = "";
  let showFullTimeTable = false;

  $: currenDay = $clockStore.day;
  $: activeData = $timetableData || data;
  $: classrooms = activeData?.aule ? activeData.aule.filter((e) => e != "") : [];
  $: classroomWeekData = activeData?.data?.filter((e) => e.aula === selectedClassroom) || [];
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
    {#if showFullTimeTable}
      <FullTimeTable
        bind:tableData={classroomWeekData}
        fields={["classe", "docente", "materia"]}
      />
    {:else}
      <TimeTable
        bind:data={classroomData}
        fields={["classe", "docente", "materia"]}
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
