<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import type { Quality } from '$lib/srs/sm2';
  import { PRIMARY_GRADES } from '$lib/srs/sm2';
  import { refreshAll } from '$lib/stores/deck';
  import {
      cards,
      correctCount,
      currentIndex,
      gradeCard,
      isComplete,
      loadSession,
      reset,
      reveal,
      revealed,
      reviewedCount,
      startTime,
  } from '$lib/stores/review';
  import { formatDuration } from '$lib/utils/date';
  import { onMount } from 'svelte';

  const deckId = $derived($page.params.deckId);
  const currentCard = $derived($cards[$currentIndex] ?? null);
  const progress = $derived($cards.length > 0 ? ($currentIndex / $cards.length) * 100 : 0);

  onMount(async () => {
    await loadSession(deckId ?? '');
  });

  function handleGrade(quality: Quality) {
    if (currentCard) gradeCard(currentCard.id, quality, deckId ?? '');
  }

  function handleExit() {
    reset();
    goto('/deck');
  }

  function handleDone() {
    reset();
    refreshAll();
    goto('/');
  }

  const durationSec = $derived($startTime ? Math.round((Date.now() - $startTime) / 1000) : 0);
  const accuracy = $derived($reviewedCount > 0 ? Math.round(($correctCount / $reviewedCount) * 100) : 0);
</script>

<svelte:head><title>Review - Nihongo SRS</title></svelte:head>

{#if $cards.length === 0 && !$isComplete}
  <div class="loading">Loading...</div>
{:else if $isComplete}
  <div class="complete">
    <h1>Session Complete!</h1>
    <div class="summary">
      <div class="summary-stat">
        <div class="summary-value" style="color: var(--color-primary)">{$reviewedCount}</div>
        <div class="summary-label">Cards Reviewed</div>
      </div>
      <div class="summary-stat">
        <div class="summary-value" style="color: var(--color-success)">{accuracy}%</div>
        <div class="summary-label">Accuracy</div>
      </div>
      <div class="summary-stat">
        <div class="summary-value">{formatDuration(durationSec)}</div>
        <div class="summary-label">Time</div>
      </div>
    </div>
    <div class="complete-buttons">
      <button class="btn secondary" onclick={() => { reset(); goto('/deck'); }}>Back to Decks</button>
      <button class="btn primary" onclick={handleDone}>Home</button>
    </div>
  </div>
{:else}
  <div class="review">
    <div class="header">
      <button class="exit" onclick={handleExit}>Exit</button>
      <span class="counter">{$currentIndex + 1}/{$cards.length}</span>
    </div>
    <div class="progress-bar">
      <div class="progress-fill" style="width: {progress}%"></div>
    </div>

    <button class="card-area" onclick={reveal} aria-label="Reveal answer">
      {#if currentCard}
        <div class="card" class:flipped={$revealed}>
          <div class="card-face front">
            <div class="card-content">
              <div class="card-text">{currentCard.front}</div>
              {#if currentCard.reading}
                <div class="card-reading">{currentCard.reading}</div>
              {/if}
            </div>
            <div class="card-hint">Tap to reveal</div>
          </div>
          <div class="card-face back">
            <div class="card-content">
              <div class="card-text">{currentCard.back}</div>
              {#if currentCard.example}
                <div class="card-example">{currentCard.example}</div>
                {#if currentCard.exampleMeaning}
                  <div class="card-example-meaning">{currentCard.exampleMeaning}</div>
                {/if}
              {/if}
            </div>
          </div>
        </div>
      {/if}
    </button>

    {#if $revealed}
      <div class="grade-buttons">
        {#each PRIMARY_GRADES as grade}
          <button
            class="grade-btn"
            style="background: {grade.color}"
            onclick={() => handleGrade(grade.grade)}
          >
            {grade.label}
          </button>
        {/each}
      </div>
    {/if}
  </div>
{/if}

<style>
  .loading { text-align: center; padding: 4rem; color: var(--text-secondary); }
  .review { display: flex; flex-direction: column; height: calc(100vh - 5rem); height: calc(100dvh - 5rem); }
  .header { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; }
  .exit { background: none; border: none; color: var(--text-secondary); font-size: 1rem; cursor: pointer; }
  .counter { color: var(--text-secondary); font-size: 0.875rem; }
  .progress-bar { height: 4px; background: var(--surface-variant); border-radius: 2px; overflow: hidden; margin-bottom: 1rem; }
  .progress-fill { height: 100%; background: var(--color-primary); border-radius: 2px; transition: width 0.3s; }
  .card-area { flex: 1; display: flex; align-items: center; justify-content: center; cursor: pointer; background: none; border: none; width: 100%; }
  .card {
    width: 100%; max-width: 400px; min-height: 300px;
    background: var(--card); border: 1px solid var(--card-border); border-radius: 1rem;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 2rem; transition: transform 0.3s;
  }
  .card.flipped { background: var(--color-primary-light); }
  .card-content { text-align: center; }
  .card-text { font-size: 2.5rem; font-weight: 700; margin-bottom: 0.5rem; }
  .card-reading { font-size: 1.25rem; color: var(--text-secondary); }
  .card-example { font-size: 1rem; margin-top: 1rem; color: var(--text); }
  .card-example-meaning { font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.25rem; }
  .card-hint { font-size: 0.875rem; color: var(--text-secondary); margin-top: 2rem; }
  .grade-buttons { display: flex; gap: 0.5rem; padding: 1rem 0; }
  .grade-btn {
    flex: 1; padding: 0.75rem; border: none; border-radius: 0.5rem;
    color: white; font-size: 1rem; font-weight: 600; cursor: pointer; transition: opacity 0.15s;
  }
  .grade-btn:active { opacity: 0.8; }
  .complete { text-align: center; padding: 3rem 1rem; }
  .complete h1 { font-size: 2rem; font-weight: 700; margin-bottom: 2rem; }
  .summary { display: flex; justify-content: space-around; margin-bottom: 2rem; }
  .summary-stat { text-align: center; }
  .summary-value { font-size: 1.75rem; font-weight: 700; }
  .summary-label { font-size: 0.75rem; color: var(--text-secondary); }
  .complete-buttons { display: flex; gap: 0.75rem; }
  .btn { flex: 1; padding: 0.75rem; border: none; border-radius: 0.5rem; font-size: 1rem; font-weight: 600; cursor: pointer; }
  .btn.primary { background: var(--color-primary); color: white; }
  .btn.secondary { background: var(--surface-variant); color: var(--text); }
</style>
