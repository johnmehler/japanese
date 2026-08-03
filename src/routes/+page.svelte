<header>
	<h1>Japanese</h1>
</header>

<nav>
	<a href="/letters" class="menu-item">Letters</a>
	<a href="/vocab" class="menu-item">Vocab</a>
	<a href="/kanji" class="menu-item">Kanji</a>
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

	nav {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.menu-item {
		display: block;
		padding: 1rem 1.25rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		font-weight: 500;
		transition: border-color 0.15s;
	}

	.menu-item:hover {
		border-color: var(--primary);
	}
</style>
