<script>
	import Header from "./Header.svelte";
</script>

<svelte:head>
	<link
		rel="stylesheet"
		href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css"
	/>
</svelte:head>

<div class="app">
	<Header />
	
	<main class="container-fluid">
		<slot />
	</main>

	<footer>
		<p>
			Developed with 💙 by Liceo Scientifico Cortese
		</p>
	</footer>
</div>

<style>
	


	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
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
