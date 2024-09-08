<script>
	import { onMount } from "svelte";
	import { weekdays, hours, getOraNum, getDay } from "$lib/dateutils.js"
    import ItemSelect from "./../ItemSelect.svelte";
    import TimeTable from "./../TimeTable.svelte";
	import { getPrefTeacher, setPrefTeacher } from "$lib/utils.js"
	export let data; 
	let currenHour,
		selectedTeacher;

	// Declarations 
	$: teacherData = data?.data?.filter(e=> e.docente=== selectedTeacher && e.day === getDay() ).sort((a,b)=>a.ora>=b.ora) || {}
	$: teachers = data.docenti;

	setInterval(()=> currenHour = getOraNum() , 1000)
	//Load data from server
	onMount(async () => {
		selectedTeacher = getPrefTeacher() || teachers[0]
	});

</script>

<div>
	<ItemSelect label="Docente" bind:item={selectedTeacher} list={teachers} onChange={setPrefTeacher(selectedTeacher)} />
	<TimeTable bind:data={teacherData} fields={["classe", "aula"]}></TimeTable>
</div>


