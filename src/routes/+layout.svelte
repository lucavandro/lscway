<script>
	import Header from "./Header.svelte";
	import HeaderMenuPanel from "./HeaderMenuPanel.svelte";
	import { getDay } from "$lib/dateutils.js";
	import { onDestroy, onMount } from "svelte";
	import Footer from "./Footer.svelte";
	import { base } from "$app/paths";
	import { dev } from "$app/environment";
	import { onNavigate } from "$app/navigation";
	import { initTheme } from "$lib/theme.js";
	import { isLoading } from "$lib/stores.js";

	export let data = undefined;
	export let params = undefined;

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

		const splash = document.getElementById("app-splash");
		if (splash) {
			splash.classList.add("is-hidden");
			setTimeout(() => {
				splash.remove();
			}, 320);
		}

		const registerServiceWorker = () => {
			if (!('serviceWorker' in navigator)) return;

			if (dev) {
				navigator.serviceWorker.getRegistrations().then((registrations) => {
					for (const registration of registrations) {
						registration.unregister();
					}
				});
			} else {
				navigator.serviceWorker
					.register(`${base}/service-worker.js`, {
						scope: `${base}/`,
						updateViaCache: 'none'
					})
					.then((registration) => {
						registration.update().catch(() => {});
					})
					.catch(() => {});
			}
		};

		if (typeof window !== 'undefined') {
			if ('requestIdleCallback' in window) {
				window.requestIdleCallback(registerServiceWorker, { timeout: 2000 });
			} else {
				setTimeout(registerServiceWorker, 1000);
			}

			// Precarica l'immagine 500 (Panda) con bassa priorità quando il browser è completamente inattivo
			const preloadEasterEggs = () => {
				fetch(`${base}/eastereggs/500.gif`, { priority: 'low' }).catch(() => {});
			};

			setTimeout(() => {
				if ('requestIdleCallback' in window) {
					window.requestIdleCallback(preloadEasterEggs, { timeout: 5000 });
				} else {
					preloadEasterEggs();
				}
			}, 4000);
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
	<script>
		window.addEventListener("beforeinstallprompt", (event) => {
			event.preventDefault();
			window.deferredInstallPrompt = event;
		});
	</script>
</svelte:head>

{#if $isLoading}
	<div id="app-splash" role="status" aria-live="polite" aria-label="Aggiornamento dati in corso">
		<div class="app-splash__card">
			<div class="app-splash__logo-wrap">
				<img src="{base}/logo-blue.png?v=20261006-2" alt="Logo WAY Cortese" class="app-splash__logo" width="76" height="76" />
			</div>
			<p class="app-splash__title">WAY Cortese</p>
			<p class="app-splash__subtitle">Liceo Scientifico N. Cortese</p>
			<div class="app-splash__spinner" aria-hidden="true"></div>
			<p class="app-splash__status">Aggiornamento orario in corso...</p>
		</div>
	</div>
{/if}

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
