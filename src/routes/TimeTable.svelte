<script>
    import { hours, getOraNum } from "$lib/dateutils.js";
    import { onMount, onDestroy } from "svelte";
    export let data = [];
    export let fields = [];

    let currentHour = getOraNum();
    let interval;

    onMount(() => {
        interval = setInterval(() => {
            currentHour = getOraNum();
        }, 1000);
    });

    onDestroy(() => {
        clearInterval(interval);
    });
</script>

<div class="overflow-auto">
    <table class="striped">
        <thead>
            <th>#</th>
            {#each fields as field}
                <th>{field}</th>
            {/each}
        </thead>
        <tbody>
            {#each hours as hour, i}
                <tr class:active={i + 1 === currentHour}>
                    <th>{i + 1}</th>
                    {#if data && data[i]}
                        {#each fields as field}
                            <td>{data[i][field]}</td>
                        {/each}
                    {:else}
                        {#each fields as field}
                            <td>-</td>
                        {/each}
                    {/if}
                </tr>
            {/each}
        </tbody>
    </table>
</div>

<style>
    thead th {
        text-transform: capitalize;
    }

    td,
    th {
        text-align: center;
    }

    tr.active th,
    tr.active td {
        /*  background-color: #00b478; */
        background-color: var(--pico-primary);
        color: white;
        font-weight: bold;
      
    }
</style>
