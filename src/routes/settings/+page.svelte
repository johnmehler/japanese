<script lang="ts">
  import { settings } from '$lib/stores/settings';
  import { resetAllProgress } from '$lib/db/client';
  import { refreshAll } from '$lib/stores/deck';
  import type { ReviewOrder, ThemeMode } from '$lib/stores/settings';
  import { get } from 'svelte/store';

  const reviewOrders: { value: ReviewOrder; label: string }[] = [
    { value: 'dueFirst', label: 'Due cards first' },
    { value: 'newFirst', label: 'New cards first' },
    { value: 'mixed', label: 'Mixed' },
  ];

  const themeModes: { value: ThemeMode; label: string }[] = [
    { value: 'system', label: 'System' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
  ];

  function handleReset() {
    if (confirm('Reset all progress? This cannot be undone.')) {
      resetAllProgress();
      refreshAll();
    }
  }
</script>

<svelte:head><title>Settings - Nihongo SRS</title></svelte:head>

<h1 class="page-title">Settings</h1>

<h2 class="section-title">Review</h2>

<div class="setting-row">
  <div class="setting-info">
    <div class="setting-label">Daily New Card Limit</div>
    <div class="setting-desc">Max new cards introduced per day</div>
  </div>
  <div class="stepper">
    <button class="stepper-btn" onclick={() => settings.setDailyNewCardLimit(Math.max(0, get(settings).dailyNewCardLimit - 5))}>-</button>
    <span class="stepper-value">{get(settings).dailyNewCardLimit}</span>
    <button class="stepper-btn" onclick={() => settings.setDailyNewCardLimit(Math.min(100, get(settings).dailyNewCardLimit + 5))}>+</button>
  </div>
</div>

<div class="setting-row">
  <div class="setting-info">
    <div class="setting-label">Daily Goal</div>
    <div class="setting-desc">Target reviews per day</div>
  </div>
  <div class="stepper">
    <button class="stepper-btn" onclick={() => settings.setDailyGoal(Math.max(10, get(settings).dailyGoal - 10))}>-</button>
    <span class="stepper-value">{get(settings).dailyGoal}</span>
    <button class="stepper-btn" onclick={() => settings.setDailyGoal(Math.min(200, get(settings).dailyGoal + 10))}>+</button>
  </div>
</div>

<div class="setting-column">
  <div class="setting-label">Review Order</div>
  {#each reviewOrders as order}
    <button class="radio-row" onclick={() => settings.setReviewOrder(order.value)}>
      <div class="radio" class:checked={get(settings).reviewOrder === order.value}></div>
      <span>{order.label}</span>
    </button>
  {/each}
</div>

<h2 class="section-title">Appearance</h2>

<div class="setting-column">
  <div class="setting-label">Theme</div>
  {#each themeModes as mode}
    <button class="radio-row" onclick={() => settings.setThemeMode(mode.value)}>
      <div class="radio" class:checked={get(settings).themeMode === mode.value}></div>
      <span>{mode.label}</span>
    </button>
  {/each}
</div>

<div class="setting-row">
  <div class="setting-info">
    <div class="setting-label">Haptic Feedback</div>
    <div class="setting-desc">Vibration on card flip and grading</div>
  </div>
  <label class="switch">
    <input type="checkbox" checked={get(settings).hapticFeedback} onchange={(e) => settings.setHapticFeedback(e.currentTarget.checked)} />
    <span class="slider"></span>
  </label>
</div>

<h2 class="section-title">Data</h2>

<button class="danger-btn" onclick={handleReset}>Reset All Progress</button>

<p class="version">Nihongo SRS v1.0.0</p>

<style>
  .page-title { font-size: 2rem; font-weight: 700; margin-bottom: 1rem; }
  .section-title { font-size: 1.25rem; font-weight: 600; margin: 1rem 0 0.5rem; }
  .setting-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 0.75rem; background: var(--card); border: 1px solid var(--card-border);
    border-radius: 0.75rem; margin-bottom: 0.5rem;
  }
  .setting-column {
    padding: 0.75rem; background: var(--card); border: 1px solid var(--card-border);
    border-radius: 0.75rem; margin-bottom: 0.5rem; display: flex; flex-direction: column; gap: 0.5rem;
  }
  .setting-info { display: flex; flex-direction: column; gap: 2px; }
  .setting-label { font-weight: 600; font-size: 1rem; }
  .setting-desc { font-size: 0.8rem; color: var(--text-secondary); }
  .stepper { display: flex; align-items: center; gap: 0.75rem; }
  .stepper-btn {
    width: 32px; height: 32px; border-radius: 50%; border: none;
    background: var(--surface-variant); color: var(--text); font-size: 1.25rem;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
  }
  .stepper-value { font-size: 1.125rem; font-weight: 700; min-width: 30px; text-align: center; }
  .radio-row {
    display: flex; align-items: center; gap: 0.75rem; padding: 0.25rem 0;
    background: none; border: none; cursor: pointer; color: var(--text); font-size: 0.95rem;
  }
  .radio {
    width: 20px; height: 20px; border-radius: 50%; border: 2px solid var(--color-primary);
    transition: background 0.15s;
  }
  .radio.checked { background: var(--color-primary); }
  .switch { position: relative; display: inline-block; width: 48px; height: 28px; }
  .switch input { opacity: 0; width: 0; height: 0; }
  .slider {
    position: absolute; cursor: pointer; inset: 0; background: var(--surface-variant);
    border-radius: 28px; transition: 0.2s;
  }
  .slider::before {
    content: ''; position: absolute; height: 22px; width: 22px; left: 3px; top: 3px;
    background: white; border-radius: 50%; transition: 0.2s;
  }
  .switch input:checked + .slider { background: var(--color-primary); }
  .switch input:checked + .slider::before { transform: translateX(20px); }
  .danger-btn {
    width: 100%; padding: 0.75rem; background: transparent; color: var(--color-danger);
    border: 1px solid var(--color-danger); border-radius: 0.5rem; font-size: 1rem;
    font-weight: 600; cursor: pointer; transition: opacity 0.15s;
  }
  .danger-btn:active { opacity: 0.7; }
  .version { font-size: 0.8rem; text-align: center; color: var(--text-secondary); margin-top: 1rem; }
</style>
