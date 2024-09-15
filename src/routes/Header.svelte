<script>
	import { getSchoolHour, getDay } from "$lib/dateutils.js";
	import { onDestroy, onMount } from "svelte";
	import PwaButton from "./PWAButton.svelte";
	import Tabs from "./Tabs.svelte";
	let day, schoolHour, interval;

	function updateTime() {
		schoolHour = getSchoolHour();
		day = getDay();
	}
	updateTime();

	// Lifecycle's events
	onMount(() => {
		interval = setInterval(updateTime, 1000);
	});

	onDestroy(() => {
		clearInterval(interval);
	});
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
				<li>{schoolHour}</li>
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

	header {
		background-color: var(--pico-muted-border-color);
	}
</style>
