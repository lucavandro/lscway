<script>
    export let rowData = [];
    export let hourIndex;
    export let fields;
    import { getDay, getHourNum } from "$lib/dateutils.js";
    import { onMount, onDestroy } from "svelte";
    import { weekdays } from "$lib/dateutils.js";
    import { inclusioneInFondo } from "$lib/utils.js";
    let currentDay = getDay();
    let currentHour = getHourNum();
    let interval;
 
    $: filterdRowData = {
        LUN: rowData.filter((e) => e.day === "LUN").sort(inclusioneInFondo),
        MAR: rowData.filter((e) => e.day === "MAR").sort(inclusioneInFondo),
        MER: rowData.filter((e) => e.day === "MER").sort(inclusioneInFondo),
        GIO: rowData.filter((e) => e.day === "GIO").sort(inclusioneInFondo),
        VEN: rowData.filter((e) => e.day === "VEN").sort(inclusioneInFondo)
    };
    function singleInfoExtraction(dayData, field) {
        let classrooms = new Set();
        dayData.forEach((entry) => {
            if (entry[field]) {
                classrooms.add(entry[field]);
            }
        });
        return Array.from(classrooms).join(", ");
    }
    onMount(() => {
        interval = setInterval(() => {
            currentDay = getDay();
            currentHour = getHourNum();
        }, 1000);
    });

    onDestroy(() => {
        clearInterval(interval);
    });
</script>

<tr class:active={false}>
    <th class="fixed">{hourIndex + 1}</th>

    {#each weekdays.slice(0, 6) as weekday}
        {#if filterdRowData[weekday].length > 0}
            <td
                class:active={hourIndex === currentHour - 1 &&
                    currentDay === weekday}
            >
            {#if fields.includes("docente")}
                {#each filterdRowData[weekday] as entry}
                    <div><b>{entry["docente_abbr"] || entry["docente"]}</b> ({entry["materia"]})</div>
                {/each}
            {:else if fields.includes("materia") && (singleInfoExtraction(filterdRowData[weekday], "materia") === "POT" || singleInfoExtraction(filterdRowData[weekday], "materia") === "RIC")}
                 <div>{singleInfoExtraction(filterdRowData[weekday], "materia")}</div>
            {/if}
           
            {#if fields.includes("classe")}
            <div>{singleInfoExtraction(filterdRowData[weekday], "classe")}</div>
            {/if} 
            {#if fields.includes("aula")}
                    <div>{singleInfoExtraction(filterdRowData[weekday], "aula")}</div>
            {/if} 
        </td>
        
        {:else}
            <td>-</td>
        {/if}
    {/each}
</tr>

<style>
    td.active,
    tr.active th,
    tr.active td {
        background-color: var(--pico-primary);
        color: white;
        font-weight: bold;
    }

    td,
    th {
        font-size: 0.75rem;
        white-space: nowrap;
    }


</style>
