<script>
	import Header from "./Header.svelte";
	import { getDay } from "$lib/dateutils.js";
	import { onDestroy, onMount } from "svelte";
	import teslaSticker from "$lib/images/tesla-sticker.png";
	let day = getDay();
	let intervalTimer;
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
</svelte:head>

<div class="app">
	{#if day === "DOM"}
		<div class="container-fluid" id="easter-egg">
			<div><img src={teslaSticker} alt="" /></div>
			<h3>
				Non posso ci posso credere...<br />anche di domenica stai su
				quest'app???
			</h3>
		</div>
	{:else}
		<Header />

		<main class="container-fluid">
			<slot />
		</main>

		<footer>
			<p>Developed with 💙 by Liceo Scientifico Cortese</p>
		</footer>
	{/if}
</div>

<style>
	#easter-egg {
		text-align: center;
		padding: 2rem;
		height: 100svh;
		display: flex;
		flex-direction: column;
		/* align-content: space-around; */
		justify-content: center;
	}

	#easter-egg img {
		max-height: 40vh;
	}

	.app {
		display: flex;
		flex-direction: column;
		min-height: 100svh;
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

	footer {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 12px;
	}
</style>
