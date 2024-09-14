<script>
	import { onMount } from "svelte";
	import { getOraNum, getDay } from "$lib/dateutils.js";
	import ItemSelect from "./ItemSelect.svelte";
	import { getPrefClass, setPrefClass } from "$lib/utils.js";
	import { page } from "$app/stores";
	import TimeTable from "./TimeTable.svelte";
	export let data;
	let classes,
		classrooms,
		currenHour,
		currenDay = getDay(),
		teachers = [],
		selectedClass;

	// Declarations
	$: classData =
		data?.data
			?.filter((e) => e.classe === selectedClass && e.day === currenDay)
			.sort((a, b) => a.ora >= b.ora) || {};
	$: teachers = data.docenti;
	$: classes = data.classi.filter((e) => e != "");
	$: classrooms = data.aule;

	setInterval(() => {
		currenDay = getDay();
		currenHour = getOraNum();
	}, 1000);

	onMount(async () => {
		let queryClass = $page.url.searchParams.get("q");
		if (queryClass && data.classi.includes(queryClass)) {
			selectedClass = queryClass
		} else {
			selectedClass = getPrefClass() || classes[0];
		}
	});
	
	function onSelectedItemChange() {
		let queryClass = $page.url.searchParams.get("q");
		if (!queryClass || queryClass !== selectedClass) {	
			setPrefClass(selectedClass);
		}
	}
</script>

<div>
	<ItemSelect
		label="Classe"
		bind:item={selectedClass}
		list={classes}
		onChange={onSelectedItemChange()}
	/>
	<TimeTable bind:data={classData} fields={["aula", "docente", "materia"]}
	></TimeTable>
</div>
