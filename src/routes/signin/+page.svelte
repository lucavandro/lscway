<script>
	import { googleAuth } from "$lib/data.js";
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { userEmail } from "$lib/stores.js";

	let errorMessage = "";
	let googleButtonContainer;
	let googleButtonReady = false;

	function resetMessages() {
		errorMessage = "";
	}

	async function handleGoogleCredential(response) {
		resetMessages();
		const result = await googleAuth(response.credential);
		console.log(result);
		if (result.success) {
			goto('/');
		} else {
			errorMessage = result.message;
		}
	}

	async function loadGoogleAuth() {
		const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
		if (!clientId) {
			errorMessage = "Aggiungi VITE_GOOGLE_CLIENT_ID per abilitare il login con Google.";
			return;
		}

		if (typeof window === "undefined" || !window.google?.accounts?.id) {
			const script = document.createElement("script");
			script.src = "https://accounts.google.com/gsi/client";
			script.async = true;
			script.defer = true;
			script.onload = () => {
				window.google.accounts.id.initialize({
					client_id: clientId,
					callback: handleGoogleCredential
				});
				window.google.accounts.id.renderButton(googleButtonContainer, {
					theme: "outline",
					size: "large",
					text: "signin_with",
					shape: "rectangular",
					width: "100%"
				});
				googleButtonReady = true;
			};
			script.onerror = () => {
				errorMessage = "Impossibile caricare il provider di accesso Google.";
			};
			document.head.appendChild(script);
			return;
		}

		window.google.accounts.id.initialize({
			client_id: clientId,
			callback: handleGoogleCredential
		});
		window.google.accounts.id.renderButton(googleButtonContainer, {
			theme: "outline",
			size: "large",
			text: "signin_with",
			shape: "rectangular",
			width: "100%"
		});
		googleButtonReady = true;
	}

	onMount(async () => {
		if ($userEmail) {
			goto('/');
			return;
		}

		await loadGoogleAuth();
	});
</script>

<div>
	{#if !$userEmail}
		<div class="signin-container">
			<h4>Funzionalità riservata ai docenti</h4>
			{#if !googleButtonReady}
				<p class="hint">Caricamento accesso Google...</p>
			{/if}
			<div bind:this={googleButtonContainer} class="google-button"></div>
			{#if errorMessage}
				<p class="error">{errorMessage}</p>
			{/if}
		</div>
	{:else}
		<p>Sei già connesso come {$userEmail}.</p>
	{/if}
</div>

<style>
	fieldset {
		margin: 60px auto;
		max-width: 400px;
	}

	button {
		width: 100%;
		margin-bottom: 10px;
	}

	.google-button {
		margin-top: 10px;
	}

	.hint {
		text-align: center;
		margin: 12px 0 0;
		opacity: 0.8;
	}
</style>
