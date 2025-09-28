<script>
	import { onDestroy, onMount } from "svelte";
	import { page } from "$app/stores";
	// Lib
	import { hotspot } from "$lib/hotspot.js";

	import { getPrefClassroom, setPrefClassroom } from "$lib/utils.js";
	// Components
	import ItemSelect from "./../ItemSelect.svelte";
	export let data;
	let currentHour, selectedClassroom, interval;

	// Declarations

	$: classrooms = Object.keys(hotspot).map((name) => name.includes("_")? name.split("_")[0]: name);	
	$: classroomHotspot = filterByPrefix(selectedClassroom);

	function filterByPrefix(prefix) {
		return Object.fromEntries(
			Object.entries(hotspot).filter(([key]) => key.startsWith(prefix)),
		);
	}
	// Handlers
	function onSelectedItemChange() {
		let queryClass = $page.url.searchParams.get("q");

		if (!queryClass || queryClass !== selectedClassroom) {
			setPrefClassroom(selectedClassroom);
		}
	}

	// Lifecycle's events
	onMount(async () => {
		let queryClass = $page.url.searchParams.get("q");

		if (queryClass && data.aule.includes(queryClass)) {
			selectedClassroom = queryClass;
		} else {
			selectedClassroom = getPrefClassroom() || classrooms[0];
		}
	});

	onDestroy(() => {
	
	});
</script>

<div>
	<ItemSelect
		label="Aula"
		bind:item={selectedClassroom}
		list={classrooms}
		onChange={onSelectedItemChange}
	/>
	{#if Object.entries(classroomHotspot).length }
		<div class="overflow-auto">
			<table class="striped">
				<thead>
					<th class="fixed">Nome</th>
					<th class="fixed">Codice</th>
				</thead>
				<tbody>
					{#each Object.entries(classroomHotspot) as [name, code]}
						<tr>
							<td>{name}</td>
							<td class="code">{code}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<p>Non ci sono hotspot per questa aula</p>
	{/if}
	<h5>Ci sono errori o non hai trovato il codice?</h5>
	<p> Segui questa procedura:</p> 
	<ul>
		<li>Dalla schermata iniziale della LIM seleziona la voce <b>"Multischermo"</b> o <b>"Mirroring"</b></li>
		<li>Fai una foto e inviala <a href="mailto:lucavandro@lscortese.com">lucavandro@lscortese.com</a></li>
		<li>Se guardi bene nella schermata dovresti indivuiduare il codice corretto
		</li>
	</ul>
	
</div>
<style>
	.code{
		text-transform: none;
	}
</style>