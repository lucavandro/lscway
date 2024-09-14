<script>
    export let data = [];
    export let fields;
    export let hourIndex;
    import { hours, getOraNum } from "$lib/dateutils.js";
    import { onMount, onDestroy } from "svelte";

    let currentHour = getOraNum();
    let interval;

    $: hour = hours[hourIndex];
    $: rowData = data.find((e) => e.ora == hour);

    onMount(() => {
        interval = setInterval(() => {
            currentHour = getOraNum();
        }, 1000);
    });

    onDestroy(() => {
        clearInterval(interval);
    });
</script>

<tr class:active={hourIndex === currentHour - 1}>
    <th>{hourIndex + 1}</th>

    {#each fields as field}
        {#if rowData}
            <td>
                {#if field === "aula"}
                    <a href={`./aula/?q=${rowData[field]}`}>{rowData[field]}</a>
                {:else if field === "docente"}
                    <a href={`./docente?q=${rowData[field]}`}>{rowData[field]}</a>                    
                {:else if field === "classe"}
                    <a href={`./?q=${rowData[field]}`}>{rowData[field]}</a>
                {:else}
                    {rowData[field]}
                {/if}
            </td>
        {:else}
            <td>-</td>
        {/if}
    {/each}
</tr>

<style>
    tr.active th,
    tr.active td {
        background-color: var(--pico-primary);
        color: white;
        font-weight: bold;
    }

   a{
        color: var(--pico-h3-color);
        text-decoration-color: var(--pico-h3-color);
        text-decoration: none;
    }
</style>
