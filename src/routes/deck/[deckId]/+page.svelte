<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { getDeckStats, getCardsForDeck, resetDeckProgress } from '$lib/db/client';
  import type { DeckWithStats, CardWithReviewState } from '$lib/db/schema';

  let deck = $state<DeckWithStats | null>(null);
  let cards = $state<CardWithReviewState[]>([]);

  const deckId = $derived($page.params.deckId);

  onMount(async () => {
    await loadDeck();
  });

  async function loadDeck() {
    deck = getDeckStats(deckId);
    cards = getCardsForDeck(deckId);
  }

  const totalDue = $derived(deck ? deck.dueCount + deck.newCount : 0);

  async function handleReset() {
    resetDeckProgress(deckId);
    await loadDeck();
  }
</script>

<svelte:head><title>{deck?.name ?? 'Deck'} - Nihongo SRS</title></svelte:head>

{#if !deck}
  <div class="loading">Loading...</div>
{:else}
  <a href="/deck" class="back">← Back to Decks</a>

  <h1 class="title">{deck.name}</h1>
  <p class="desc">{deck.description}</p>

  <div class="stats-row">
    <div class="stat-card">
      <div class="stat-value" style="color: var(--color-primary)">{deck.masteryPercent}%</div>
      <div class="stat-label">Mastery</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="color: var(--color-danger)">{deck.dueCount}</div>
      <div class="stat-label">Due</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="color: var(--color-warning)">{deck.newCount}</div>
      <div class="stat-label">New</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">{deck.cardCount}</div>
      <div class="stat-label">Total</div>
    </div>
  </div>

  {#if totalDue > 0}
    <button class="start-btn" onclick={() => goto(`/deck/review/${deckId}`)}>
      Start Review
      <span class="start-subtext">{totalDue} cards ready</span>
    </button>
  {:else}
    <div class="all-done">All caught up! Come back later. 🎉</div>
  {/if}

  <h2 class="section-title">Cards ({cards.length})</h2>
  <div class="card-list">
    {#each cards.slice(0, 50) as card}
      <div class="card-row">
        <span class="card-front">{card.front}</span>
        <span class="card-back">{card.back}</span>
        {#if card.reviewState}
          <span class="card-status">{card.reviewState.interval}d · EF {card.reviewState.easinessFactor.toFixed(1)}</span>
        {/if}
      </div>
    {/each}
  </div>
  {#if cards.length > 50}
    <p class="more-cards">+{cards.length - 50} more cards...</p>
  {/if}

  <button class="reset-btn" onclick={handleReset}>Reset deck progress</button>
{/if}

<style>
  .loading { text-align: center; padding: 4rem; color: var(--text-secondary); }
  .back { display: inline-block; margin-bottom: 1rem; color: var(--text-secondary); text-decoration: none; font-size: 0.875rem; }
  .title { font-size: 2rem; font-weight: 700; }
  .desc { color: var(--text-secondary); margin-bottom: 1.5rem; }
  .stats-row { display: flex; justify-content: space-around; margin-bottom: 1.5rem; }
  .stat-card { text-align: center; }
  .stat-value { font-size: 1.75rem; font-weight: 700; }
  .stat-label { font-size: 0.75rem; color: var(--text-secondary); }
  .start-btn {
    width: 100%; padding: 1rem; background: var(--color-primary); color: white;
    border: none; border-radius: 0.75rem; font-size: 1.125rem; font-weight: 700;
    display: flex; flex-direction: column; align-items: center; gap: 0.25rem;
    cursor: pointer; margin-bottom: 1.5rem; transition: opacity 0.15s;
  }
  .start-btn:active { opacity: 0.8; }
  .start-subtext { font-size: 0.875rem; font-weight: 400; opacity: 0.8; }
  .all-done { text-align: center; padding: 1.5rem; background: var(--surface); border-radius: 0.75rem; margin-bottom: 1.5rem; color: var(--text-secondary); }
  .section-title { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.75rem; }
  .card-list { display: flex; flex-direction: column; gap: 0.5rem; }
  .card-row {
    display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem;
    background: var(--card); border: 1px solid var(--card-border); border-radius: 0.5rem;
  }
  .card-front { font-size: 1.125rem; font-weight: 500; min-width: 60px; }
  .card-back { font-size: 0.875rem; flex: 1; color: var(--text-secondary); }
  .card-status { font-size: 0.7rem; color: var(--text-secondary); }
  .more-cards { text-align: center; padding: 0.5rem; color: var(--text-secondary); font-size: 0.875rem; }
  .reset-btn {
    width: 100%; padding: 0.75rem; background: transparent; color: var(--text-secondary);
    border: 1px solid var(--card-border); border-radius: 0.5rem; font-size: 0.875rem;
    cursor: pointer; margin-top: 1rem; transition: opacity 0.15s;
  }
  .reset-btn:active { opacity: 0.7; }
</style>
