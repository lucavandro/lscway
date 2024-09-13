<script>
	import { getOraScolastica, getDay } from "$lib/dateutils.js";
	import PwaButton from "./PWAButton.svelte";
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
