<script>
	import Header from "./Header.svelte";
	import { getDay } from "$lib/dateutils.js";
	import { onDestroy, onMount } from "svelte";
    import Footer from "./Footer.svelte";

	let day = getDay();
	let intervalTimer;

	// Lifecycle events
	onMount(() => {
		intervalTimer = setInterval(() => {
			day = getDay();
		}, 60 * 1000);
	});

	onDestroy(() => {
		clearInterval(intervalTimer);
	});
	
</script>

<svelte:head>
	<link
		rel="stylesheet"
		href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css"
	/>
	<script>
		window.addEventListener("beforeinstallprompt", (event) => {
			event.preventDefault();
			window.deferredInstallPrompt = event;
		});
	</script>
</svelte:head>

<div class="app">
	<Header />

	<main class="container-fluid">
		<slot />
	</main>

	<Footer />
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 1rem;
		width: 100%;
		max-width: 64rem;
		margin: 0 auto;
		box-sizing: border-box;
	}


</style>
