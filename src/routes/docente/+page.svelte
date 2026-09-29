<script>
  import { onMount, onDestroy } from "svelte";
  import { getDay } from "$lib/dateutils.js";
  import { getPrefTeacher, setPrefTeacher } from "$lib/utils.js";
  import { page } from "$app/stores";
  import TimeTable from "./../TimeTable.svelte";
  import ItemSelect from "./../ItemSelect.svelte";
  import FullTimeTable from "./../FullTimeTable.svelte";
  import FullTimeTableSwitch from "./../FullTimeTableSwitch.svelte";

  export let data;
  let selectedTeacher = "";
  let showFullTimeTable = false;
  let currenDay = getDay();

  $: teachers = data?.docenti || [];
  $: teacherWeekData = data?.data?.filter((e) => e.docente === selectedTeacher) || [];
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
  <title>Orario Prof. {selectedTeacher} - WAY Cortese</title>
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
    <div class="section-meta">
      <h2 class="section-title">
        <span>Prof. {selectedTeacher}</span>
        <span class="view-tag">{showFullTimeTable ? "Settimanale" : `Oggi (${currenDay})`}</span>
      </h2>
    </div>

    {#if showFullTimeTable}
      <FullTimeTable
        bind:tableData={teacherWeekData}
        fields={["classe", "aula", "materia"]}
      />
    {:else}
      <TimeTable bind:data={teacherData} fields={["classe", "aula", "materia"]} />
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
      max-width: 340px;
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
