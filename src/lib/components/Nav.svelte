<script lang="ts">
  import { page } from '$app/stores';
  import { dbReady } from '$lib/stores/deck';

  const tabs = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/deck', label: 'Decks', icon: '📚' },
    { href: '/stats', label: 'Stats', icon: '📊' },
    { href: '/settings', label: 'Settings', icon: '⚙️' },
  ];
</script>

<nav class="bottom-nav">
  {#each tabs as tab}
    <a
      href={tab.href}
      class="tab"
      class:active={$page.url.pathname === tab.href ||
        (tab.href !== '/' && $page.url.pathname.startsWith(tab.href))}
    >
      <span class="icon">{tab.icon}</span>
      <span class="label">{tab.label}</span>
    </a>
  {/each}
</nav>

<style>
  .bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-around;
    background: var(--card);
    border-top: 1px solid var(--card-border);
    padding-bottom: env(safe-area-inset-bottom, 0);
    z-index: 100;
  }
  .tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 0.5rem 0;
    text-decoration: none;
    color: var(--text-secondary);
    font-size: 0.75rem;
    transition: color 0.15s;
  }
  .tab.active {
    color: var(--color-primary);
  }
  .icon {
    font-size: 1.25rem;
  }
  .label {
    font-size: 0.7rem;
  }
</style>
