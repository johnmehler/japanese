<script lang="ts">
  import { onMount } from 'svelte';
  import { decks, refreshDecks } from '$lib/stores/deck';
  import type { DeckCategory } from '$lib/db/schema';

  const categoryLabels: Record<DeckCategory, string> = {
    hiragana: 'Kana',
    katakana: 'Kana',
    kanji: 'Kanji',
    vocab: 'Vocabulary',
  };

  onMount(async () => {
    await refreshDecks();
  });

  const grouped = $derived.by(() => {
    const g: Record<string, typeof $decks> = {};
    for (const deck of $decks) {
      const label = categoryLabels[deck.category];
      if (!g[label]) g[label] = [];
      g[label].push(deck);
    }
    return g;
  });
</script>

<svelte:head><title>Decks - Nihongo SRS</title></svelte:head>

<h1 class="page-title">Decks</h1>

{#each Object.entries(grouped) as [label, deckList]}
  <div class="group">
    <h2 class="group-title">{label}</h2>
    <div class="deck-list">
      {#each deckList as deck}
        <a href="/deck/{deck.id}" class="deck-item">
          <div class="deck-info">
            <span class="deck-name">{deck.name}</span>
            <span class="deck-meta">{deck.cardCount} cards · {deck.masteryPercent}% mastery</span>
          </div>
          <div class="deck-stats">
            <span class="stat due">{deck.dueCount} due</span>
            <span class="stat new">{deck.newCount} new</span>
          </div>
        </a>
      {/each}
    </div>
  </div>
{/each}

<style>
  .page-title { font-size: 2rem; font-weight: 700; margin-bottom: 1rem; }
  .group { margin-bottom: 1.5rem; }
  .group-title { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.75rem; }
  .deck-list { display: flex; flex-direction: column; gap: 0.5rem; }
  .deck-item {
    display: flex; justify-content: space-between; align-items: center;
    padding: 0.75rem 1rem; background: var(--card); border: 1px solid var(--card-border);
    border-radius: 0.5rem; text-decoration: none; color: inherit; transition: opacity 0.15s;
  }
  .deck-item:active { opacity: 0.7; }
  .deck-info { display: flex; flex-direction: column; gap: 2px; }
  .deck-name { font-weight: 600; }
  .deck-meta { font-size: 0.75rem; color: var(--text-secondary); }
  .deck-stats { display: flex; gap: 0.75rem; }
  .stat { font-size: 0.875rem; font-weight: 600; }
  .stat.due { color: var(--color-danger); }
  .stat.new { color: var(--color-warning); }
</style>
