<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { initDb } from '$lib/db/client';
  import { refreshAll, dbReady } from '$lib/stores/deck';
  import { settings } from '$lib/stores/settings';
  import { get } from 'svelte/store';
  import Nav from '$lib/components/Nav.svelte';

  let { children } = $props();

  onMount(async () => {
    await initDb();
    await refreshAll();
    applyTheme(get(settings).themeMode);
  });

  settings.subscribe((s) => {
    applyTheme(s.themeMode);
  });

  function applyTheme(mode: 'system' | 'light' | 'dark') {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (mode === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', mode === 'dark');
    }
  }
</script>

<div class="app">
  <main class="content">
    {@render children()}
  </main>
  <Nav />
</div>

<style>
  .app {
    min-height: 100vh;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
  }
  .content {
    flex: 1;
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
    padding: 1rem;
    padding-bottom: 5rem;
  }
</style>
