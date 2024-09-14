<script>
	import { onMount } from "svelte";
	import { getOraNum, getDay } from "$lib/dateutils.js";
	import ItemSelect from "./../ItemSelect.svelte";
	import TimeTable from "./../TimeTable.svelte";
	import { getPrefTeacher, setPrefTeacher } from "$lib/utils.js";
	import { page } from "$app/stores";
	export let data;
	let currenHour, selectedTeacher;

	// Declarations
	$: teacherData =
		data?.data
			?.filter((e) => e.docente === selectedTeacher && e.day === getDay())
			.sort((a, b) => a.ora >= b.ora) || {};
	$: teachers = data.docenti;

	setInterval(() => (currenHour = getOraNum()), 1000);
	//Load data from server
	onMount(async () => {
		let queryClass = $page.url.searchParams.get("q");
		if (queryClass && data.docenti.includes(queryClass)) {
			selectedTeacher = queryClass;
		} else {
			selectedTeacher = getPrefTeacher() || teachers[0];
		}
	});

	function onSelectedItemChange() {
		let queryClass = $page.url.searchParams.get("q");
		if (!queryClass || queryClass !== selectedTeacher) {	
			setPrefTeacher(selectedTeacher);
		}
	}

	
</script>

<div>
	<ItemSelect
		label="Docente"
		bind:item={selectedTeacher}
		list={teachers}
		onChange={onSelectedItemChange()}
	/>
	<TimeTable bind:data={teacherData} fields={["classe", "aula"]}></TimeTable>
</div>
