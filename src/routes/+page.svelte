<script>
	import { onMount } from "svelte";
	import { weekdays, hours, getOraNum, getDay } from "$lib/dateutils.js"
    import ItemSelect from "./ItemSelect.svelte";
	import { getPrefClass, setPrefClass } from "$lib/utils.js"
	import {getData} from '$lib/data.js'
    import TimeTable from "./TimeTable.svelte";
	export let data;
	let classes,
		classrooms,
		currenHour,
		teachers = [],
		selectedClass;

	// Declarations 
	/*
	$: teacherData = data?.data?.filter(
		(e) => e.docente.toUpperCase() === selectedTeacher.toUpperCase(),
	);*/
	$: currentDay = weekdays[ new Date().getDay() - 1 ]
	$: classData = data?.data?.filter(e=> e.classe === selectedClass && e.day === getDay() ).sort((a,b)=>a.ora>=b.ora) || {}
	$: teachers = data.docenti;
	$: classes = data.classi.filter(e => e != "");
	$: classrooms = data.aule;

	setInterval(()=> currenHour = getOraNum() , 1000)

	onMount(async () => {
		selectedClass = getPrefClass() || classes[0]		
	});

</script>
<div>
	<ItemSelect label="Classe" bind:item={selectedClass} list={classes} onChange={setPrefClass(selectedClass)} />
	<TimeTable bind:data={classData} fields={["aula", "docente", "materia"]}></TimeTable>
</div>


