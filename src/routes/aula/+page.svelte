<script>
	import { onDestroy, onMount } from "svelte";
	import { page } from "$app/stores";
	// Lib
	import { getHourNum, getDay } from "$lib/dateutils.js";
	import { getPrefClassroom, setPrefClassroom } from "$lib/utils.js";
	// Components
	import ItemSelect from "./../ItemSelect.svelte";
	import TimeTable from "./../TimeTable.svelte";
	import FullTimeTable from "./../FullTimeTable.svelte";
	import FullTimeTableSwitch from "./../FullTimeTableSwitch.svelte";
	export let data;
	let currentHour,
		selectedClassroom,
		showFullTimeTable = false,
		interval;
		
	// Declarations
	$: classroomWeekData =
		data?.data?.filter((e) => e.aula === selectedClassroom) || [];
	$: classroomData =
		classroomWeekData?.filter((e) => e.day === getDay()) || [];
	$: classrooms = data.aule.filter((e) => e != "");

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
		interval = setInterval(() => (currentHour = getHourNum()), 1000);
		showFullTimeTable = JSON.parse(sessionStorage.getItem('lscway:aula:showFullTable'))
	});
	
	onDestroy(() => {
		clearInterval(interval)
		sessionStorage.setItem('lscway:aula:showFullTable', JSON.stringify(showFullTimeTable))
	});
</script>

<div>
	<ItemSelect
		label="Aula"
		bind:item={selectedClassroom}
		list={classrooms}
		onChange={onSelectedItemChange}
	/>
	<FullTimeTableSwitch bind:control={showFullTimeTable} />
	{#if showFullTimeTable}
		<FullTimeTable
			bind:tableData={classroomWeekData}
			fields={["classe", "docente", "materia"]}
		/>
	{:else}
		<TimeTable
			bind:data={classroomData}
			fields={["classe", "docente", "materia"]}
		/>
	{/if}
</div>
