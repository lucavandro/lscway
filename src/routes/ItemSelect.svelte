<script>
    export let item
    export let list = []
    export let label = 'selectItem'
    export let onChange = function(){}
</script>

<label for="{label}">{label}</label>
<select id="{label}" bind:value={item} on:change={onChange}>
    {#each list as element}
        <option value={element}>{element}</option>
    {/each}
</select>