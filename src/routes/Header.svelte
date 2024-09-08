<script>
	import { getOraScolastica, getDay } from "$lib/dateutils.js";
	import Tabs from "./Tabs.svelte";
	let time;
	let day;
	let oraScolastica;

	function updateTime() {
		time = new Date().toTimeString().split(" ")[0];
		oraScolastica = getOraScolastica();
		day = getDay();
	}
	updateTime();
	setInterval(updateTime, 1000);
</script>

<header>
	<div class="container">
		<nav>
			<ul>
				<li><strong>Cortese WAY</strong></li>
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
	header {
		background-color: #1d232f;
	}
</style>
