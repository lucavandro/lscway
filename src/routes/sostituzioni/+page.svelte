<script>
	import { userEmail } from "$lib/stores.js";
	import { goto } from "$app/navigation";
	import { onMount, onDestroy } from "svelte";

	let sostituzioni = [];
	let loading = false;
	let error = null;
	let interval;

	// Funzione per ottenere la data odierna in formato YYYY-MM-DD
	function getTodayDate() {
		const today = new Date();
		return today.toISOString().split('T')[0];
	}

	// Computed per filtrare le sostituzioni odierne
	$: sostituzioniOggi = sostituzioni.filter(s => s.data === getTodayDate());

	async function fetchSostituzioni() {
		if (!$userEmail) return;
		
		loading = true;
		error = null;
		
		try {
			const response = await fetch(`https://www.liceoscientificocortese.edu.it/app/way/docenti_sostituzioni_api.php?email=${encodeURIComponent($userEmail)}`);
			const data = await response.json();
			
			if (data.success) {
				sostituzioni = data.data;
			} else {
				error = "Errore nel recupero dei dati";
			}
		} catch (err) {
			error = "Errore di connessione";
			console.error("Errore fetch sostituzioni:", err);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		// Reindirizza alla home se l'utente non è loggato
		if (!$userEmail) {
			goto('/');
		} else {
			fetchSostituzioni();
			// Aggiorna i dati ogni minuto (60000ms)
			interval = setInterval(fetchSostituzioni, 60000);
		}
	});

	onDestroy(() => {
		if (interval) {
			clearInterval(interval);
		}
	});
</script>

<svelte:head>
	<title>Sostituzioni - WAY Cortese</title>
</svelte:head>

<main class="container">
	{#if $userEmail}
		{#if loading}
			<p aria-busy="true">Caricamento sostituzioni...</p>
		{:else if error}
			<article class="error">
				<p>{error}</p>
				<button on:click={fetchSostituzioni}>Riprova</button>
			</article>
		{:else}
			<!-- Sezione sostituzioni odierne -->
			<section class="today-section">
				<h2>Sostituzioni di oggi</h2>
				{#if sostituzioniOggi.length > 0}
					<div class="today-cards">
						{#each sostituzioniOggi as sostituzione}
							<article class="today-card">
								<header>
									<strong>{sostituzione.ora} - {sostituzione.classe}</strong>
									<span class="badge" class:accepted={sostituzione.accettato} class:rejected={!sostituzione.accettato}>
										{sostituzione.accettato ? 'Accettato' : 'Rifiutato'}
									</span>
								</header>
								<p><strong>Aula:</strong> {sostituzione.aula}</p>
								<p><strong>Sostituito da:</strong> {sostituzione.docSost}</p>
								{#if sostituzione.note}
									<p><strong>Note:</strong> {sostituzione.note}</p>
								{/if}
							</article>
						{/each}
					</div>
				{:else}
					<p class="no-substitutions">Non sono previste sostituzioni per te oggi. 🥳</p>
				{/if}
			</section>

			<!-- Sezione storico -->
			{#if sostituzioni.length > 0}
				<section class="history-section">
					<h2>Storico sostituzioni</h2>
					<p>Trovate {sostituzioni.length} sostituzioni</p>
					
					<div class="overflow-auto">
						<table>
							<thead>
								<tr>
									<th>Data</th>
									<th>Giorno</th>
									<th>Ora</th>
									<th>Classe</th>
									<th>Aula</th>
									<th>Docente Sostituto</th>
									<th>Note</th>
									<th>Stato</th>
								</tr>
							</thead>
							<tbody>
								{#each sostituzioni as sostituzione}
									<tr>
										<td>{sostituzione.data}</td>
										<td>{sostituzione.giorno}</td>
										<td>{sostituzione.ora}</td>
										<td>{sostituzione.classe}</td>
										<td>{sostituzione.aula}</td>
										<td>{sostituzione.docSost}</td>
										<td>{sostituzione.note || '-'}</td>
										<td>
											<span class="badge" class:accepted={sostituzione.accettato} class:rejected={!sostituzione.accettato}>
												{sostituzione.accettato ? 'Accettato' : 'Rifiutato'}
											</span>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</section>
			{:else}
				<p>Nessuna sostituzione trovata.</p>
			{/if}
		{/if}
	{:else}
		<h1>Accesso negato</h1>
		<p>Devi effettuare l'accesso per visualizzare questa pagina.</p>
	{/if}
</main>

<style>
	.error {
		background-color: var(--pico-del-background-color);
		border: 1px solid var(--pico-del-color);
		border-radius: var(--pico-border-radius);
		padding: 1rem;
		margin: 1rem 0;
	}

	.overflow-auto {
		overflow-x: auto;
	}

	table {
		margin-top: 1rem;
		width: 100%;
		min-width: 800px;
	}

	.badge {
		padding: 0.25rem 0.5rem;
		border-radius: var(--pico-border-radius);
		font-size: 0.875rem;
		font-weight: 500;
	}

	.badge.accepted {
		background-color: var(--pico-ins-background-color);
		color: var(--pico-ins-color);
	}

	.badge.rejected {
		background-color: var(--pico-del-background-color);
		color: var(--pico-del-color);
	}

	.today-section {
		margin-bottom: 2rem;
		padding-bottom: 2rem;
		border-bottom: 1px solid var(--pico-muted-border-color);
	}

	.today-cards {
		display: grid;
		gap: 1rem;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		margin-top: 1rem;
	}

	.today-card {
		background: var(--pico-background-color);
		border: 1px solid var(--pico-muted-border-color);
		border-radius: var(--pico-border-radius);
		padding: 1rem;
		margin: 0;
	}

	.today-card header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--pico-muted-border-color);
	}

	.today-card p {
		margin: 0.25rem 0;
		font-size: 0.9rem;
	}

	.no-substitutions {
		text-align: center;
		font-size: 1.1rem;
		color: var(--pico-muted-color);
		margin: 2rem 0;
	}

	.history-section {
		margin-top: 2rem;
	}

	@media (max-width: 768px) {
		table {
			font-size: 0.875rem;
		}
		
		th, td {
			padding: 0.5rem 0.25rem;
		}
	}
</style>
