<script lang="ts">
	import { goto } from '$app/navigation';

	function handleKey(e: KeyboardEvent) {
		const routes: Record<string, string> = {
			'1': '/letters',
			'2': '/vocab',
			'3': '/kanji',
		};
		const route = routes[e.key];
		if (!route) return;
		e.preventDefault();
		goto(route);
	}
</script>

<svelte:window onkeydown={handleKey} />

<header>
	<h1>Japanese</h1>
	<p class="shortcut-hint">Press 1 for Letters · 2 for Vocab · 3 for Kanji</p>
</header>

<nav>
	<a href="/letters" class="menu-item"><span class="shortcut">1</span>Letters</a>
	<a href="/vocab" class="menu-item"><span class="shortcut">2</span>Vocab</a>
	<a href="/kanji" class="menu-item"><span class="shortcut">3</span>Kanji</a>
</nav>

<style>
	header {
		text-align: center;
		margin-bottom: 2rem;
		padding-top: 1rem;
	}

	header h1 {
		font-size: 1.75rem;
		font-weight: 700;
		letter-spacing: -0.02em;
	}

	.shortcut-hint {
		color: var(--text-secondary);
		font-size: 0.8rem;
		margin-top: 0.5rem;
	}

	nav {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.menu-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 1.25rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		font-weight: 500;
		transition: border-color 0.15s;
	}

	.menu-item:hover {
		border-color: var(--primary);
	}

	.shortcut {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		border: 1px solid var(--border);
		border-radius: 0.35rem;
		color: var(--text-secondary);
		font-size: 0.8rem;
	}
</style>
