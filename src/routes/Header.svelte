<script>
	import { getSchoolHour, getDay } from "$lib/dateutils.js";
    import { onMount } from "svelte";
	import PwaButton from "./PWAButton.svelte";
	import Tabs from "./Tabs.svelte";
	let day;
	let oraScolastica;

	function updateTime() {
		oraScolastica = getSchoolHour();
		day = getDay();
	}
	updateTime();
	

	onMount(()=>{
		setInterval(updateTime, 1000);
	})
</script>

<header>
	<div class="container">
		<nav>
			<ul>
				<li><strong>WAY Cortese</strong></li>
				<li><PwaButton /></li>
			</ul>
			<ul>
				<li>{day}</li>
				<li>{oraScolastica}</li>
			</ul>
		</nav>
		<Tabs></Tabs>
	</div>
</header>

<style>
	@media (prefers-color-scheme: dark) {
		header {
			background-color: #1d232f;
		}
	}

	header{
		background-color: var(--pico-muted-border-color);
	}
</style>
