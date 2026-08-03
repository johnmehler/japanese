<script lang="ts">
  import { onMount } from 'svelte';
  import { decks, totalDue, totalNew, todayReviewed, dbReady, refreshAll } from '$lib/stores/deck';
  import { settings } from '$lib/stores/settings';
  import { getSessionLogs } from '$lib/db/client';
  import { formatDuration } from '$lib/utils/date';
  import { get } from 'svelte/store';
  import { goto } from '$app/navigation';

  let streak = $state(0);

  onMount(async () => {
    if (get(dbReady)) {
      await refreshAll();
    }
    calculateStreak();
  });

  function calculateStreak() {
    const logs = getSessionLogs();
    const days = new Set<string>();
    for (const log of logs) {
      days.add(log.date.split('T')[0]);
    }
    let count = 0;
    const today = new Date();
    while (true) {
      const iso = today.toISOString().split('T')[0];
      if (days.has(iso)) {
        count++;
        today.setDate(today.getDate() - 1);
      } else {
        break;
      }
    }
    streak = count;
  }

  const dailyGoal = $derived(get(settings).dailyGoal);
  const progress = $derived(dailyGoal > 0 ? Math.min(100, ($todayReviewed / dailyGoal) * 100) : 0);
  const totalReady = $derived($totalDue + $totalNew);
</script>

<svelte:head>
  <title>Nihongo SRS</title>
</svelte:head>

{#if !$dbReady}
  <div class="loading">Loading...</div>
{:else}
  <div class="home">
    <h1 class="title">Nihongo</h1>

    <div class="streak-row">
      <div class="streak-badge">
        <span class="streak-icon">🔥</span>
        <span class="streak-count">{streak}</span>
        <span class="streak-label">day streak</span>
      </div>
    </div>

    <div class="progress-section">
      <div class="progress-header">
        <span>Today's Progress</span>
        <span>{$todayReviewed} / {dailyGoal}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: {progress}%"></div>
      </div>
    </div>

    {#if totalReady > 0}
      <button class="start-btn" onclick={() => goto('/deck')}>
        Start Review
        <span class="start-subtext">{totalReady} cards ready</span>
      </button>
    {:else}
      <div class="all-done">
        All caught up! Come back later. 🎉
      </div>
    {/if}

    <div class="decks-section">
      <h2 class="section-title">Your Decks</h2>
      <div class="deck-list">
        {#each $decks as deck}
          <a href="/deck/{deck.id}" class="deck-item">
            <div class="deck-info">
              <span class="deck-name">{deck.name}</span>
              <span class="deck-meta">{deck.cardCount} cards</span>
            </div>
            <div class="deck-stats">
              <span class="stat due">{deck.dueCount}</span>
              <span class="stat new">{deck.newCount}</span>
              <span class="mastery">{deck.masteryPercent}%</span>
            </div>
          </a>
        {/each}
      </div>
    </div>
  </div>
{/if}

<style>
  .loading { text-align: center; padding: 4rem; color: var(--text-secondary); }
  .title { font-size: 2rem; font-weight: 700; margin-bottom: 1rem; }
  .streak-row { margin-bottom: 1.5rem; }
  .streak-badge {
    display: inline-flex; align-items: center; gap: 0.5rem;
    background: var(--color-warning-light); padding: 0.5rem 1rem; border-radius: 9999px;
  }
  .streak-icon { font-size: 1.25rem; }
  .streak-count { font-weight: 700; font-size: 1.25rem; }
  .streak-label { color: var(--text-secondary); font-size: 0.875rem; }
  .progress-section { margin-bottom: 1.5rem; }
  .progress-header {
    display: flex; justify-content: space-between; margin-bottom: 0.5rem;
    font-size: 0.875rem; color: var(--text-secondary);
  }
  .progress-bar {
    height: 8px; background: var(--surface-variant); border-radius: 4px; overflow: hidden;
  }
  .progress-fill {
    height: 100%; background: var(--color-primary); border-radius: 4px; transition: width 0.3s;
  }
  .start-btn {
    width: 100%; padding: 1rem; background: var(--color-primary); color: white;
    border: none; border-radius: 0.75rem; font-size: 1.125rem; font-weight: 700;
    display: flex; flex-direction: column; align-items: center; gap: 0.25rem;
    cursor: pointer; margin-bottom: 1.5rem; transition: opacity 0.15s;
  }
  .start-btn:active { opacity: 0.8; }
  .start-subtext { font-size: 0.875rem; font-weight: 400; opacity: 0.8; }
  .all-done {
    text-align: center; padding: 1.5rem; background: var(--surface); border-radius: 0.75rem;
    margin-bottom: 1.5rem; color: var(--text-secondary);
  }
  .section-title { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.75rem; }
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
  .deck-stats { display: flex; align-items: center; gap: 0.75rem; }
  .stat { font-weight: 700; font-size: 0.875rem; }
  .stat.due { color: var(--color-danger); }
  .stat.new { color: var(--color-warning); }
  .mastery { font-size: 0.75rem; color: var(--text-secondary); }
</style>
