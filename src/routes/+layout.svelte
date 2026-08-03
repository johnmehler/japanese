<script>
	import '../app.css';
	let { children } = $props();
</script>

<div class="app-shell">
	<main class="app-card">
		{@render children()}
	</main>
</div>

<style>
	.app-shell {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 3rem 1rem;
	}

	.app-card {
		max-width: 420px;
		width: 100%;
		max-height: calc(100vh - 6rem);
		overflow-y: auto;
		background-color: var(--bg);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 1.5rem 1.25rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
		display: flex;
		flex-direction: column;
	}

	@media (max-width: 768px) {
		.app-shell {
			padding: 2rem 1rem;
		}

		.app-card {
			max-height: calc(100vh - 4rem);
		}
	}

	@media (max-width: 480px) {
		.app-shell {
			padding: 0;
			justify-content: flex-start;
		}

		.app-card {
			border: none;
			border-radius: 0;
			box-shadow: none;
			max-height: none;
			min-height: 100vh;
			padding: 1.5rem 1rem;
		}
	}
</style>
