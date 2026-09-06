<script>
  import FullTimeTableRow from "./FullTimeTableRow.svelte";
  import { weekdays, hours } from "$lib/dateutils.js";
  export let tableData = [];
  export let fields = [];

  $: rowsData = [
    tableData.filter((e) => e.ora === hours[0]),
    tableData.filter((e) => e.ora === hours[1]),
    tableData.filter((e) => e.ora === hours[2]),
    tableData.filter((e) => e.ora === hours[3]),
    tableData.filter((e) => e.ora === hours[4]),
    tableData.filter((e) => e.ora === hours[5]),
    tableData.filter((e) => e.ora === hours[6]),
    tableData.filter((e) => e.ora === hours[7]),
  ];
</script>

<div class="overflow-auto">
  <table class="striped">
    <thead>
      <th class="fixed">#</th>
      {#each weekdays.slice(0, 6) as weekday}
        <th>{weekday}</th>
      {/each}
    </thead>
    <tbody>
      {#each { length: 7 } as _, i}
        <FullTimeTableRow hourIndex={i} bind:rowData={rowsData[i]} {fields} />
      {/each}
    </tbody>
  </table>
</div>

<style>
  thead th {
    font-size: 0.75rem;
  }
</style>
