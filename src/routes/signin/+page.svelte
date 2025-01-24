<script>
	import {auth} from "$lib/data.js";
	import { onDestroy, onMount } from "svelte";
	import { page } from "$app/stores";
	// Lib

	// Components

	let email = "lucavandro@lscortese.com";

	// Handlers
	function onSubmit(e) {
		e.preventDefault()
		auth(email).then(r => console.log(r))
		
	}

	// Lifecycle's events
	onMount(async () => {});

	onDestroy(() => {});
</script>

<div>
	<form on:submit={onSubmit}>
		<fieldset>
			<label>
				Email
				<input
					bind:value={email}
					type="email"
					id="email"
					name="email"
					placeholder="Inserisci la tua email @lscortese.com"
				/>
			</label>
			<button>Invia</button>
		</fieldset>
	</form>
	
</div>


<style>
	fieldset{
		margin: 60px auto;
		max-width: 400px;
	}
	button{width: 100%;}
</style>