<script>
    export let rowData = [];
    export let fields;
    export let hourIndex;
    import { hours, getDay, getHourNum } from "$lib/dateutils.js";
    import { onMount, onDestroy } from "svelte";
    import { weekdays } from "$lib/dateutils.js";

    let currentDay = getDay();
    let currentHour = getHourNum();
    let interval;
    let hour = hours[hourIndex];

    $: filterdRowData = {
        LUN: rowData.filter((e) => e.day === "LUN"),
        MAR: rowData.filter((e) => e.day === "MAR"),
        MER: rowData.filter((e) => e.day === "MER"),
        GIO: rowData.filter((e) => e.day === "GIO"),
        VEN: rowData.filter((e) => e.day === "VEN"),
        SAB: rowData.filter((e) => e.day === "SAB"),
    };

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
        {#if filterdRowData[weekday].length === 1}
            <td
                class:active={hourIndex === currentHour - 1 &&
                    currentDay === weekday}
            >
                {#each fields as field}
                    <div>{filterdRowData[weekday][0][field]}</div>
                {/each}
            </td>
        {:else if filterdRowData[weekday].length === 2}
            <td
                class:active={hourIndex === currentHour - 1 &&
                    currentDay === weekday}
            >
                {#each fields as field}
                    <div>{filterdRowData[weekday][0][field]}/{filterdRowData[weekday][1][field]}</div>
                {/each}
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
