<script>
	import { auth, confirm, googleAuth } from "$lib/data.js";
	import { onDestroy, onMount } from "svelte";
	import { userEmail } from "$lib/stores.js";

	let email = "",
		code = "",
		showConfirm = false,
		errorMessage = "",
		successMessage = "",
		googleButtonContainer,
		googleButtonReady = false;

	function resetMessages() {
		errorMessage = "";
		successMessage = "";
	}

	async function onSubmit(e) {
		e.preventDefault();
		if (showConfirm) {
			const response = await confirm(email, code);
			if (response.success) {
				userEmail.set(email);
				successMessage = "Accesso effettuato";
			} else {
				showConfirm = true;
				errorMessage = response.message;
				successMessage = ""
			}

		} else {
			const response = await auth(email);
			if (response.success) {
				showConfirm = true;
				errorMessage = ""
				successMessage = response.message;
			} else {
				showConfirm = false;
				errorMessage = response.message;
				successMessage = ""
			}
		}
	}

	async function handleGoogleCredential(response) {
		resetMessages();
		const result = await googleAuth(response.credential);
		console.log(result)
		if (result.success) {
			showConfirm = false;
			successMessage = result.message;
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

	// Lifecycle's events
	onMount(async () => {
		if (!$userEmail) {
			await loadGoogleAuth();
		}
	});

	onDestroy(() => {});
</script>

<div>
	
	<form on:submit={onSubmit}>
		<fieldset>
			<h4>Funzionalità riservata ai docenti</h4>
			{#if !$userEmail}
				<label>
					Email
					<input
						bind:value={email}
						type="email"
						id="email"
						name="email"
						placeholder="Inserisci la tua email @lscortese.com"
						readonly={showConfirm}
						required
					/>
				</label>
				{#if showConfirm}
					<label>
						Codice
						<input
							bind:value={code}
							type="text"
							id="code"
							name="code"
							placeholder="Inserisci il codice ricevuto"
							required
						/>
					</label>
				{/if}
				<button type="submit">Invia</button>
				{#if showConfirm}
				<button class="outline" on:click={()=>showConfirm=false} tabindex="0">Indietro</button>
				{/if}
				{#if !googleButtonReady}
					<p class="hint">Oppure</p>
				{/if}
				<div bind:this={googleButtonContainer} class="google-button"></div>
				{#if errorMessage}
					<p class="error">{errorMessage}</p>
				{/if}
			{/if}
			{#if successMessage}
				<p class="success">{successMessage}</p>
			{/if}
		</fieldset>
	</form>
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
