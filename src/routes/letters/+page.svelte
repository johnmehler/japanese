<script lang="ts">
	import { getKana, type KanaSet } from '$lib/data/kana';
	import { SRSDeck } from '$lib/srs';

	let mode = $state<'select' | 'quiz'>('select');
	let selectedSet = $state<KanaSet | null>(null);
	let deck = $state<SRSDeck | null>(null);
	let quizLabel = $state('');
	let quizDirection = $state<'forward' | 'reverse'>('forward');

	let queue = $state<string[]>([]);
	let currentId = $state<string | null>(null);
	let currentChar = $state('');
	let currentRomaji = $state('');
	let input = $state('');
	let feedback = $state<'none' | 'correct' | 'wrong'>('none');
	let sessionCount = $state(0);
	let sessionCorrect = $state(0);
	let inputEl = $state<HTMLInputElement | null>(null);

	// Reverse mode: multiple choice
	let choices = $state<string[]>([]);
	let selectedChoice = $state<string | null>(null);

	function getMissCounts(set: KanaSet): Record<string, number> {
		try {
			const raw = localStorage.getItem(`letters:miss:${set}`);
			return raw ? JSON.parse(raw) : {};
		} catch {
			return {};
		}
	}

	function recordMiss(set: KanaSet, char: string) {
		const counts = getMissCounts(set);
		counts[char] = (counts[char] ?? 0) + 1;
		localStorage.setItem(`letters:miss:${set}`, JSON.stringify(counts));
	}

	function getCommonlyMissed(set: KanaSet, limit = 15): string[] {
		const counts = getMissCounts(set);
		return Object.entries(counts)
			.sort((a, b) => b[1] - a[1])
			.slice(0, limit)
			.map(([char]) => char);
	}

	function startQuiz(set: KanaSet, direction: 'forward' | 'reverse' = 'forward') {
		selectedSet = set;
		quizDirection = direction;
		deck = new SRSDeck(`letters:${set}`);
		const chars = getKana(set);
		const allIds = chars.map((c) => c.char);
		const due = deck.getDueCards(allIds);
		queue = shuffle(due);
		quizLabel = set === 'hiragana' ? 'Hiragana' : set === 'katakana' ? 'Katakana' : 'Combined';
		if (direction === 'reverse') quizLabel += ' (reverse)';
		sessionCount = 0;
		sessionCorrect = 0;
		feedback = 'none';
		input = '';
		mode = 'quiz';
		nextCard();
	}

	function startMissedQuiz(set: KanaSet) {
		let missed: string[];
		if (set === 'both') {
			missed = [...getCommonlyMissed('hiragana'), ...getCommonlyMissed('katakana')];
		} else {
			missed = getCommonlyMissed(set);
		}
		if (missed.length === 0) return;
		selectedSet = set;
		quizDirection = 'forward';
		deck = new SRSDeck(`letters:${set}`);
		queue = shuffle(missed);
		quizLabel = 'Commonly Missed';
		sessionCount = 0;
		sessionCorrect = 0;
		feedback = 'none';
		input = '';
		mode = 'quiz';
		nextCard();
	}

	function shuffle(arr: string[]) {
		const copy = [...arr];
		for (let i = copy.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[copy[i], copy[j]] = [copy[j], copy[i]];
		}
		return copy;
	}

	function nextCard() {
		if (queue.length === 0) {
			currentId = null;
			return;
		}
		currentId = queue.shift() ?? null;
		const chars = getKana(selectedSet!);
		const found = chars.find((c) => c.char === currentId);
		currentChar = found?.char ?? '';
		currentRomaji = found?.romaji ?? '';
		input = '';
		feedback = 'none';
		selectedChoice = null;
		if (quizDirection === 'reverse' && found) {
			choices = makeChoices(found.char, chars);
		} else {
			requestAnimationFrame(() => inputEl?.focus());
		}
	}

	function makeChoices(correctChar: string, chars: { char: string; romaji: string }[]): string[] {
		const wrong = chars.filter((c) => c.char !== correctChar);
		const picked = shuffle(wrong.map((c) => c.char)).slice(0, 3);
		return shuffle([correctChar, ...picked]);
	}

	function submit() {
		if (feedback !== 'none' || !currentId || !deck || !selectedSet) return;

		const chars = getKana(selectedSet);
		const found = chars.find((c) => c.char === currentId);
		if (!found) return;

		let correct: boolean;
		if (quizDirection === 'reverse') {
			correct = selectedChoice === found.char;
		} else {
			const answer = input.trim().toLowerCase();
			correct = answer === found.romaji;
		}
		feedback = correct ? 'correct' : 'wrong';
		sessionCount++;
		if (correct) sessionCorrect++;

		deck.review(currentId, correct ? 5 : 0);

		if (!correct) {
			recordMiss(selectedSet!, currentId);
			queue.push(currentId);
		}
	}

	function selectChoice(choice: string) {
		if (feedback !== 'none') return;
		selectedChoice = choice;
		submit();
	}

	function handleKey(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			if (feedback !== 'none') {
				nextCard();
			} else {
				submit();
			}
		} else if (e.key === ' ' && feedback !== 'none') {
			e.preventDefault();
			nextCard();
		} else if (quizDirection === 'reverse' && feedback === 'none' && e.key >= '1' && e.key <= '4') {
			const idx = parseInt(e.key) - 1;
			if (choices[idx]) selectChoice(choices[idx]);
		}
	}

	function backToSelect() {
		mode = 'select';
		selectedSet = null;
		deck = null;
		queue = [];
		currentId = null;
		refreshMissedCounts();
	}

	function restart() {
		if (!selectedSet) return;
		const chars = getKana(selectedSet);
		queue = shuffle(chars.map((c) => c.char));
		quizLabel = selectedSet === 'hiragana' ? 'Hiragana' : selectedSet === 'katakana' ? 'Katakana' : 'Combined';
		if (quizDirection === 'reverse') quizLabel += ' (reverse)';
		sessionCount = 0;
		sessionCorrect = 0;
		feedback = 'none';
		input = '';
		nextCard();
	}

	let missedHiragana = $state(0);
	let missedKatakana = $state(0);
	let missedBoth = $state(0);

	function refreshMissedCounts() {
		missedHiragana = getCommonlyMissed('hiragana').length;
		missedKatakana = getCommonlyMissed('katakana').length;
		const hira = getCommonlyMissed('hiragana');
		const kata = getCommonlyMissed('katakana');
		missedBoth = hira.length + kata.length;
	}

	refreshMissedCounts();
</script>

<svelte:window onkeydown={mode === 'quiz' ? handleKey : undefined} />

{#if mode === 'select'}
	<div class="select-screen">
		<h1>Letters</h1>
		<p class="subtitle">Choose a writing system</p>
		<div class="btn-pair">
			<button onclick={() => startQuiz('hiragana')} class="mode-btn">
				<span class="mode-label">Hiragana</span>
				<span class="mode-sample">あ → a</span>
			</button>
			<button onclick={() => startQuiz('hiragana', 'reverse')} class="mode-btn reverse-btn">
				<span class="mode-label">Reverse</span>
				<span class="mode-sample">a → あ</span>
			</button>
		</div>
		<div class="btn-pair">
			<button onclick={() => startQuiz('katakana')} class="mode-btn">
				<span class="mode-label">Katakana</span>
				<span class="mode-sample">ア → a</span>
			</button>
			<button onclick={() => startQuiz('katakana', 'reverse')} class="mode-btn reverse-btn">
				<span class="mode-label">Reverse</span>
				<span class="mode-sample">a → ア</span>
			</button>
		</div>
		<div class="btn-pair">
			<button onclick={() => startQuiz('both')} class="mode-btn combined-btn">
				<span class="mode-label">Combined</span>
				<span class="mode-sample">あ + ア → a</span>
			</button>
			<button onclick={() => startQuiz('both', 'reverse')} class="mode-btn reverse-btn">
				<span class="mode-label">Reverse</span>
				<span class="mode-sample">a → あ / ア</span>
			</button>
		</div>
		{#if missedBoth > 0}
			<div class="missed-section">
				<p class="missed-title">Commonly Missed</p>
				<div class="btn-pair">
					{#if missedHiragana > 0}
						<button onclick={() => startMissedQuiz('hiragana')} class="mode-btn missed-btn">
							<span class="mode-label">Hiragana</span>
							<span class="mode-sample">{missedHiragana} letters</span>
						</button>
					{/if}
					{#if missedKatakana > 0}
						<button onclick={() => startMissedQuiz('katakana')} class="mode-btn missed-btn">
							<span class="mode-label">Katakana</span>
							<span class="mode-sample">{missedKatakana} letters</span>
						</button>
					{/if}
					<button onclick={() => startMissedQuiz('both')} class="mode-btn missed-btn">
						<span class="mode-label">Both</span>
						<span class="mode-sample">{missedBoth} letters</span>
					</button>
				</div>
			</div>
		{/if}
		<a href="/" class="back-link">← Home</a>
	</div>
{:else if currentId === null}
	<div class="done-screen">
		<h1>Session Complete</h1>
		<p class="score">{sessionCorrect} / {sessionCount} correct</p>
		<button onclick={() => startQuiz(selectedSet!, quizDirection)} class="action-btn">Study Again</button>
		<button onclick={backToSelect} class="action-btn secondary">Change Set</button>
		<a href="/" class="back-link">← Home</a>
	</div>
{:else}
	<div class="quiz-screen">
		<div class="quiz-header">
			<button onclick={backToSelect} class="back-btn">←</button>
			<span class="counter">{quizLabel} · {sessionCount} reviewed · {queue.length} left</span>
			<button onclick={restart} class="restart-btn">↻</button>
		</div>

		<div class="char-display">{quizDirection === 'reverse' ? currentRomaji : currentChar}</div>

		{#if feedback === 'none'}
			{#if quizDirection === 'reverse'}
				<div class="choices">
					{#each choices as choice, i}
					<button
						onclick={() => selectChoice(choice)}
						class="choice-btn"
					>
						<span class="choice-num">{i + 1}</span>
						{choice}
					</button>
					{/each}
				</div>
			{:else}
				<input
					bind:this={inputEl}
					bind:value={input}
					placeholder="type romaji..."
					class="answer-input"
					autocomplete="off"
					autocapitalize="none"
					spellcheck="false"
				/>
				<button onclick={submit} class="action-btn" disabled={!input.trim()}>
					Check
				</button>
			{/if}
		{:else}
			<div class="feedback {feedback}">
				{#if feedback === 'correct'}
					✓ Correct!
				{:else}
					✗ Correct answer: {quizDirection === 'reverse' ? getKana(selectedSet!).find((c) => c.char === currentId)?.char : getKana(selectedSet!).find((c) => c.char === currentId)?.romaji}
				{/if}
			</div>
			<button onclick={nextCard} class="action-btn">Next →</button>
			<p class="hint">press space for next</p>
		{/if}
	</div>
{/if}

<style>
	.select-screen,
	.done-screen,
	.quiz-screen {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	h1 {
		font-size: 1.75rem;
		font-weight: 700;
		letter-spacing: -0.02em;
	}

	.subtitle {
		color: var(--text-secondary);
		font-size: 0.9rem;
		margin-bottom: 0.5rem;
	}

	.mode-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 1.5rem 1.25rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		cursor: pointer;
		transition: border-color 0.15s;
		font-family: inherit;
	}

	.mode-btn:hover {
		border-color: var(--primary);
	}

	.mode-label {
		font-size: 1.2rem;
		font-weight: 600;
		color: var(--text);
	}

	.mode-sample {
		font-size: 0.85rem;
		color: var(--text-secondary);
	}

	.btn-pair {
		display: flex;
		gap: 0.5rem;
		width: 100%;
	}

	.btn-pair .mode-btn {
		flex: 1;
	}

	.missed-section {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-top: 0.5rem;
		padding-top: 1rem;
		border-top: 1px solid var(--border);
	}

	.missed-title {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.missed-btn {
		padding: 1rem 1.25rem;
	}

	.missed-btn .mode-label {
		font-size: 1rem;
		color: #ef4444;
	}

	.reverse-btn {
		padding: 1rem 1.25rem;
	}

	.reverse-btn .mode-label {
		font-size: 1rem;
		color: var(--text-secondary);
	}

	.combined-btn .mode-label {
		color: var(--primary);
	}

	.choices {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		width: 100%;
		justify-content: center;
	}

	.choice-btn {
		flex: 1 1 calc(50% - 0.25rem);
		min-width: 80px;
		padding: 1.25rem 0.5rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		cursor: pointer;
		font-family: inherit;
		font-size: 2rem;
		color: var(--text);
		transition: border-color 0.15s;
		position: relative;
	}

	.choice-btn:hover {
		border-color: var(--primary);
	}

	.choice-num {
		position: absolute;
		top: 0.25rem;
		left: 0.4rem;
		font-size: 0.7rem;
		color: var(--text-secondary);
		opacity: 0.5;
	}

	.back-link {
		color: var(--text-secondary);
		font-size: 0.85rem;
		margin-top: 0.5rem;
	}

	.quiz-header {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.back-btn {
		background: none;
		border: none;
		font-size: 1.2rem;
		cursor: pointer;
		color: var(--text-secondary);
		padding: 0.25rem 0.5rem;
	}

	.counter {
		font-size: 0.8rem;
		color: var(--text-secondary);
	}

	.restart-btn {
		background: none;
		border: none;
		font-size: 1.1rem;
		cursor: pointer;
		color: var(--text-secondary);
		padding: 0.25rem 0.5rem;
	}

	.hint {
		font-size: 0.75rem;
		color: var(--text-secondary);
		opacity: 0.6;
	}

	.char-display {
		font-size: 6rem;
		line-height: 1.2;
		text-align: center;
		margin: 1.5rem 0;
	}

	.answer-input {
		width: 100%;
		padding: 0.75rem 1rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		font-size: 1.1rem;
		text-align: center;
		background: var(--bg);
		color: var(--text);
		font-family: inherit;
	}

	.answer-input:focus {
		outline: none;
		border-color: var(--primary);
	}

	.action-btn {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: var(--radius);
		background: var(--primary);
		color: white;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		font-family: inherit;
		transition: background 0.15s;
	}

	.action-btn:hover:not(:disabled) {
		background: var(--primary-hover);
	}

	.action-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.action-btn.secondary {
		background: var(--surface);
		color: var(--text);
		border: 1px solid var(--border);
	}

	.feedback {
		font-size: 1.1rem;
		font-weight: 500;
		text-align: center;
		padding: 0.75rem 1rem;
		border-radius: var(--radius);
		width: 100%;
	}

	.feedback.correct {
		background: #22c55e20;
		color: #22c55e;
	}

	.feedback.wrong {
		background: #ef444420;
		color: #ef4444;
	}

	.score {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--text);
	}
</style>
