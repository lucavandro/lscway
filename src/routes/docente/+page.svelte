<script>
  import { onMount, onDestroy } from "svelte";
  import { getDay } from "$lib/dateutils.js";
  import { getPrefTeacher, setPrefTeacher } from "$lib/utils.js";
  import { page } from "$app/stores";
  import { timetableData } from "$lib/stores.js";
  import TimeTable from "./../TimeTable.svelte";
  import ItemSelect from "./../ItemSelect.svelte";
  import FullTimeTable from "./../FullTimeTable.svelte";
  import FullTimeTableSwitch from "./../FullTimeTableSwitch.svelte";

  export let data;
  export let params = undefined;
  let selectedTeacher = "";
  let showFullTimeTable = false;
  let currenDay = getDay();

  $: activeData = $timetableData || data;
  $: teachers = activeData?.docenti || [];
  $: teacherWeekData = activeData?.data?.filter((e) => e.docente === selectedTeacher) || [];
  $: teacherData = teacherWeekData.filter((e) => e.day === currenDay);

  onMount(() => {
    let queryTeacher = $page.url.searchParams.get("q");
    if (queryTeacher && teachers.includes(queryTeacher)) {
      selectedTeacher = queryTeacher;
    } else {
      selectedTeacher = getPrefTeacher() || teachers[0] || "";
    }

    try {
      const saved = sessionStorage.getItem("lscway:docente:showFullTable");
      if (saved !== null) {
        showFullTimeTable = JSON.parse(saved);
      }
    } catch (e) {}
  });

  onDestroy(() => {
    try {
      sessionStorage.setItem("lscway:docente:showFullTable", JSON.stringify(showFullTimeTable));
    } catch (e) {}
  });

  function onSelectedItemChange() {
    let queryTeacher = $page.url.searchParams.get("q");
    if (!queryTeacher || queryTeacher !== selectedTeacher) {
      setPrefTeacher(selectedTeacher);
    }
  }
</script>

<svelte:head>
  <title>Orario {selectedTeacher} - WAY Cortese</title>
</svelte:head>

<div class="page-container">
  <div class="toolbar-card">
    <div class="toolbar-select">
      <ItemSelect
        label="Docente"
        bind:item={selectedTeacher}
        list={teachers}
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
        bind:tableData={teacherWeekData}
        fields={["classe", "aula", "materia"]}
      />
    {:else}
      <TimeTable
        bind:data={teacherData}
        fields={["classe", "aula", "materia"]}
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
      max-width: 340px;
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
