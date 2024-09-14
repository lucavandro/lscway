<script>
	import { onMount } from "svelte";
	import {getOraNum, getDay } from "$lib/dateutils.js"
	import {getPrefClassroom, setPrefClassroom } from "$lib/utils.js"
    import ItemSelect from "./../ItemSelect.svelte";
    import TimeTable from "./../TimeTable.svelte";
	import { page } from "$app/stores";
	export let data; 
	let currenHour,
		selectedClassroom;

	$: classroomData = data?.data?.filter(e=> e.aula=== selectedClassroom && e.day === getDay() ).sort((a,b)=>a.ora>=b.ora) || {}
	$: classrooms = data.aule.filter(e => e != "");

	setInterval(()=> currenHour = getOraNum() , 1000)
	//Load data from server
	onMount(async () => {
		let queryClass = $page.url.searchParams.get("q");
	
		if (queryClass && data.aule.includes(queryClass)) {
			selectedClassroom = queryClass
		} else {
			selectedClassroom = getPrefClassroom() || classrooms[0];
		}
		
	});



</script>

<div>
	<ItemSelect label="Aula" bind:item={selectedClassroom} list={classrooms} onChange={setPrefClassroom(selectedClassroom)} />
	<TimeTable bind:data={classroomData} fields={["classe", "docente", "materia"]}></TimeTable>
</div>