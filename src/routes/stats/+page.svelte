<script lang="ts">
  import { onMount } from 'svelte';
  import {
    getReviewActivityByDay, getAccuracyByDay, getOverallStats, getSessionLogs,
  } from '$lib/db/client';

  let streak = $state(0);
  let activity = $state<{ date: string; count: number }[]>([]);
  let accuracy = $state<{ date: string; accuracy: number }[]>([]);
  let overall = $state({ totalReviews: 0, totalCorrect: 0, totalCards: 0, masteredCards: 0 });
  let recentSessions = $state<{ id: string; deckId: string; date: string; cardsReviewed: number; correctCount: number; durationSec: number }[]>([]);

  onMount(() => {
    calculateStreak();
    activity = getReviewActivityByDay(90);
    accuracy = getAccuracyByDay(30);
    overall = getOverallStats();
    recentSessions = getSessionLogs().slice(0, 10);
  });

  function calculateStreak() {
    const logs = getSessionLogs();
    const days = new Set<string>();
    for (const log of logs) days.add(log.date.split('T')[0]);
    let count = 0;
    const today = new Date();
    while (true) {
      const iso = today.toISOString().split('T')[0];
      if (days.has(iso)) { count++; today.setDate(today.getDate() - 1); }
      else break;
    }
    streak = count;
  }

  const retentionRate = $derived(overall.totalReviews > 0 ? Math.round((overall.totalCorrect / overall.totalReviews) * 100) : 0);
  const masteryPercent = $derived(overall.totalCards > 0 ? Math.round((overall.masteredCards / overall.totalCards) * 100) : 0);
  const maxActivity = $derived(Math.max(...activity.map((a) => a.count), 1));
</script>

<svelte:head><title>Stats - Nihongo SRS</title></svelte:head>

<h1 class="page-title">Statistics</h1>

<div class="streak-badge">
  <span class="streak-icon">🔥</span>
  <span class="streak-count">{streak}</span>
  <span class="streak-label">day streak</span>
</div>

<div class="stats-grid">
  <div class="stat-box">
    <div class="stat-number" style="color: var(--color-primary)">{overall.totalReviews}</div>
    <div class="stat-name">Total Reviews</div>
  </div>
  <div class="stat-box">
    <div class="stat-number" style="color: var(--color-success)">{retentionRate}%</div>
    <div class="stat-name">Retention</div>
  </div>
  <div class="stat-box">
    <div class="stat-number" style="color: var(--color-accent)">{overall.totalCards}</div>
    <div class="stat-name">Cards Learned</div>
  </div>
  <div class="stat-box">
    <div class="stat-number" style="color: var(--color-warning)">{masteryPercent}%</div>
    <div class="stat-name">Mastery</div>
  </div>
</div>

<h2 class="section-title">Review Activity (90 days)</h2>
<div class="heatmap-container">
  {#if activity.length === 0}
    <p class="empty">No activity yet. Start reviewing!</p>
  {:else}
    <div class="heatmap">
      {#each activity as day}
        {@const intensity = day.count / maxActivity}
        <div
          class="heatmap-cell"
          style="background: {intensity === 0 ? 'var(--surface-variant)' : intensity < 0.25 ? 'var(--color-primary-light)' : intensity < 0.5 ? 'var(--color-primary)' : intensity < 0.75 ? 'var(--color-primary)' : 'var(--color-primary)'}; opacity: {intensity === 0 ? 1 : Math.max(0.3, intensity)}"
        ></div>
      {/each}
    </div>
  {/if}
</div>

<h2 class="section-title">Accuracy (30 days)</h2>
<div class="chart-container">
  {#if accuracy.length === 0}
    <p class="empty">No data yet.</p>
  {:else}
    <div class="chart-bars">
      {#each accuracy as day}
        <div class="chart-bar-wrapper">
          <div class="chart-bar" style="height: {Math.round(day.accuracy * 100)}%; background: var(--color-success)"></div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<h2 class="section-title">Recent Sessions</h2>
{#if recentSessions.length === 0}
  <p class="empty">No sessions yet.</p>
{:else}
  <div class="session-list">
    {#each recentSessions as session}
      {@const acc = session.cardsReviewed > 0 ? Math.round((session.correctCount / session.cardsReviewed) * 100) : 0}
      <div class="session-row">
        <div class="session-info">
          <span class="session-deck">{session.deckId}</span>
          <span class="session-date">{new Date(session.date).toLocaleDateString()}</span>
        </div>
        <div class="session-stats">
          <span>{session.cardsReviewed} cards</span>
          <span class="session-acc">{acc}%</span>
        </div>
      </div>
    {/each}
  </div>
{/if}

<style>
  .page-title { font-size: 2rem; font-weight: 700; margin-bottom: 1rem; }
  .streak-badge {
    display: inline-flex; align-items: center; gap: 0.5rem;
    background: var(--color-warning-light); padding: 0.5rem 1rem; border-radius: 9999px;
    margin-bottom: 1.5rem;
  }
  .streak-icon { font-size: 1.25rem; }
  .streak-count { font-weight: 700; font-size: 1.25rem; }
  .streak-label { color: var(--text-secondary); font-size: 0.875rem; }
  .stats-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.5rem; }
  .stat-box {
    flex: 1; min-width: 45%; padding: 0.75rem; background: var(--card);
    border: 1px solid var(--card-border); border-radius: 0.75rem; text-align: center;
  }
  .stat-number { font-size: 1.75rem; font-weight: 700; }
  .stat-name { font-size: 0.75rem; color: var(--text-secondary); }
  .section-title { font-size: 1.25rem; font-weight: 600; margin: 1rem 0 0.5rem; }
  .heatmap-container, .chart-container {
    background: var(--card); border: 1px solid var(--card-border); border-radius: 0.75rem;
    padding: 0.75rem; margin-bottom: 1rem;
  }
  .heatmap { display: flex; flex-wrap: wrap; gap: 3px; }
  .heatmap-cell { width: 12px; height: 12px; border-radius: 2px; }
  .chart-bars { display: flex; align-items: flex-end; height: 100px; gap: 2px; }
  .chart-bar-wrapper { flex: 1; height: 100%; display: flex; align-items: flex-end; }
  .chart-bar { width: 100%; border-radius: 2px; min-height: 2px; }
  .empty { text-align: center; padding: 0.75rem; color: var(--text-secondary); font-size: 0.875rem; }
  .session-list { display: flex; flex-direction: column; gap: 0.5rem; }
  .session-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 0.75rem; background: var(--card); border: 1px solid var(--card-border); border-radius: 0.5rem;
  }
  .session-info { display: flex; flex-direction: column; gap: 2px; }
  .session-deck { font-weight: 600; font-size: 0.875rem; }
  .session-date { font-size: 0.75rem; color: var(--text-secondary); }
  .session-stats { display: flex; gap: 0.75rem; font-size: 0.8rem; }
  .session-acc { color: var(--text-secondary); }
</style>
