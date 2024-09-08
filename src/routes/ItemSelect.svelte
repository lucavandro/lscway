<script>
    export let item
    export let list = []
    export let label
    export let onChange = function(){}
</script>

<label for="">{label}</label>
<select bind:value={item} on:change={onChange}>
    {#each list as element}
        <option value={element}>{element}</option>
    {/each}
</select>