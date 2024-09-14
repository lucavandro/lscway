<script>
    export let data = [];
    export let fields;
    export let hourIndex;
    import { hours, getHourNum } from "$lib/dateutils.js";
    import { onMount, onDestroy } from "svelte";

    let currentHour = getHourNum();
    let interval;

    $: hour = hours[hourIndex];
    $: rowData = data.filter((e) => e.ora == hour);

    onMount(() => {
        interval = setInterval(() => {
            currentHour = getHourNum();
        }, 1000);
    });

    onDestroy(() => {
        clearInterval(interval);
    });
</script>

{#if rowData.length == 1}
    {#each rowData as rd}
        <tr class:active={hourIndex === currentHour - 1}>
            <th>{hourIndex + 1}</th>
            {#each fields as field}
                <td>
                    {#if field === "aula"}
                        <a href={`./aula/?q=${rd[field]}`}>{rd[field]}</a>
                    {:else if field === "docente"}
                        <a href={`./docente?q=${rd[field]}`}>{rd[field]}</a>
                    {:else if field === "classe"}
                        <a href={`./?q=${rd[field]}`}>{rd[field]}</a>
                    {:else}
                        {rd[field]}
                    {/if}
                </td>
            {/each}
        </tr>
    {/each}
{:else if rowData.length == 2}
    <tr class:active={hourIndex === currentHour - 1}>
        <th>{hourIndex + 1}</th>
        {#each fields as field}
            <td>
                {#if field === "aula"}
                    <a href={`./aula/?q=${rowData[0][field]}`}>{rowData[0][field]}</a>
                    <hr>
                    <a href={`./aula/?q=${rowData[1][field]}`}>{rowData[1][field]}</a>
                {:else if field === "docente"}
                    <a href={`./docente?q=${rowData[0][field]}`}>{rowData[0][field]}</a>
                    <hr>
                    <a href={`./docente?q=${rowData[1][field]}`}>{rowData[1][field]}</a>
                {:else if field === "classe"}
                    <a href={`./?q=${rowData[0][field]}`}>{rowData[0][field]}</a>
                    <hr>
                    <a href={`./?q=${rowData[1][field]}`}>{rowData[1][field]}</a>
                {:else}
                    {rowData[0][field]}
                    <hr>
                    {rowData[1][field]}
                {/if}
            </td>
        {/each}
    </tr>
{:else}
    <tr class:active={hourIndex === currentHour - 1}>
        <th>{hourIndex + 1}</th>
        {#each fields as field}
            <td>-</td>
        {/each}
    </tr>
{/if}

<style>
    tr.active th,
    tr.active td {
        background-color: var(--pico-primary);
        color: white;
        font-weight: bold;
    }

    a {
        color: var(--pico-h3-color);
        text-decoration-color: var(--pico-h3-color);
        text-decoration: none;
    }
</style>
