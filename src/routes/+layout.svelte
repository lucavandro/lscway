<script>
	import Header from "./Header.svelte";
	import HeaderMenuPanel from "./HeaderMenuPanel.svelte";
	import { getDay } from "$lib/dateutils.js";
	import { onDestroy, onMount } from "svelte";
	import Footer from "./Footer.svelte";
	import { base } from "$app/paths";
	import { onNavigate } from "$app/navigation";
	import { initTheme } from "$lib/theme.js";

	let day = getDay();
	let intervalTimer;

	// Modern View Transitions API for page navigation
	onNavigate((navigation) => {
		if (!document.startViewTransition) return;

		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});

	// Lifecycle events
	onMount(() => {
		initTheme();
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.register(`${base}/service-worker.js`, { scope: `${base}/` });
		}

		// Precarica l'immagine 500 (Panda) nel browser e nel Cache Storage per la fruizione offline
		if (typeof window !== 'undefined') {
			const pandaUrls = [
				`${base}/eastereggs/500.gif`,
				`${base}/easterggs/500.gif`
			];

			// 1. Precaricamento in memoria/HTTP cache
			pandaUrls.forEach((url) => {
				const img = new Image();
				img.src = url;
			});

			// 2. Precaricamento esplicito nel Cache Storage utilizzato dal Service Worker
			if ('caches' in window) {
				caches.open('lscway-cache').then((cache) => {
					pandaUrls.forEach((url) => {
						cache.add(url).catch(() => {});
					});
				}).catch(() => {});
			}
		}

		intervalTimer = setInterval(() => {
			day = getDay();
		}, 60 * 1000);
	});

	onDestroy(() => {
		if (intervalTimer) {
			clearInterval(intervalTimer);
		}
	});
</script>

<svelte:head>
	<link rel="prefetch" href="{base}/eastereggs/500.gif" as="image" />
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

	<main class="container-fluid" id="main-content">
		<slot />
	</main>

	<Footer />
</div>

<HeaderMenuPanel />

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100dvh;
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		width: 100%;
		max-width: 68rem;
		margin: 0 auto;
		box-sizing: border-box;
	}
</style>
