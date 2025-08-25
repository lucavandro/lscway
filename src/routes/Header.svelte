<script>
	import { getSchoolHour, getDay } from "$lib/dateutils.js";
	import { onDestroy, onMount } from "svelte";
	import PwaButton from "./PWAButton.svelte";
	import Tabs from "./Tabs.svelte";
	import { userEmail, loadUserFromStorage } from "$lib/stores.js";

	let day, schoolHour, interval;

	function updateTime() {
		schoolHour = getSchoolHour();
		day = getDay();
	}

	function logout() {
		userEmail.set("");
	}
	updateTime();

	// Lifecycle's events
	onMount(() => {
		interval = setInterval(updateTime, 1000);
		loadUserFromStorage();
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
				{#if $userEmail}
					<li><a on:click={logout}>Disconnetti</a></li>
				{:else}
					<li><a href="signin">Accedi</a></li>
				{/if}
				
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
