<script lang="ts">
	import { n5Vocab, type VocabItem } from '$lib/data/vocab';
	import { SRSDeck } from '$lib/srs';

	type Mode = 'select' | 'study' | 'test';
	type TestType = 'pronunciation' | 'meaning';
	type TestQuestion = {
		item: VocabItem;
		type: TestType;
		choices?: string[];
	};

	let mode = $state<Mode>('select');
	let deck = $state<SRSDeck | null>(null);
	let showRomaji = $state(true);

	// Study state
	let studyQueue = $state<string[]>([]);
	let studyId = $state<string | null>(null);
	let studyItem = $state<VocabItem | null>(null);
	let studyFlipped = $state(false);
	let studyCount = $state(0);

	// Test state
	let testQueue = $state<TestQuestion[]>([]);
	let testCurrent = $state<TestQuestion | null>(null);
	let testInput = $state('');
	let testFeedback = $state<'none' | 'correct' | 'wrong'>('none');
	let testCount = $state(0);
	let testCorrect = $state(0);
	let inputEl = $state<HTMLInputElement | null>(null);

	function shuffle<T>(arr: T[]): T[] {
		const copy = [...arr];
		for (let i = copy.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[copy[i], copy[j]] = [copy[j], copy[i]];
		}
		return copy;
	}

	function getItem(id: string): VocabItem | undefined {
		return n5Vocab.find((v) => v.id === id);
	}

	// --- Study mode ---
	function startStudy() {
		deck = new SRSDeck('vocab:n5');
		const allIds = n5Vocab.map((v) => v.id);
		const due = deck.getDueCards(allIds);
		studyQueue = shuffle(due);
		studyCount = 0;
		studyFlipped = false;
		mode = 'study';
		nextStudyCard();
	}

	function nextStudyCard() {
		if (studyQueue.length === 0) {
			studyId = null;
			studyItem = null;
			return;
		}
		studyId = studyQueue.shift() ?? null;
		studyItem = getItem(studyId!) ?? null;
		studyFlipped = false;
		studyCount++;
	}

	function flipCard() {
		studyFlipped = !studyFlipped;
	}

	function studyRate(correct: boolean) {
		if (!deck || !studyId) return;
		deck.review(studyId, correct ? 5 : 0);
		nextStudyCard();
	}

	function handleStudyKey(e: KeyboardEvent) {
		if (e.key === ' ' || e.key === 'Enter') {
			e.preventDefault();
			if (studyFlipped) {
				studyRate(true);
			} else {
				flipCard();
			}
		}
	}

	// --- Test mode ---
	function startTest() {
		deck = new SRSDeck('vocab:n5');
		const allIds = n5Vocab.map((v) => v.id);
		const due = deck.getDueCards(allIds);
		const shuffled = shuffle(due);
		const questions: TestQuestion[] = shuffled.map((id) => {
			const item = getItem(id)!;
			const type: TestType = Math.random() < 0.5 ? 'pronunciation' : 'meaning';
			let choices: string[] | undefined;
			if (type === 'meaning') {
				choices = makeChoices(item);
			}
			return { item, type, choices };
		});
		testQueue = questions;
		testCount = 0;
		testCorrect = 0;
		testFeedback = 'none';
		testInput = '';
		mode = 'test';
		nextTestQuestion();
	}

	function makeChoices(item: VocabItem): string[] {
		const others = n5Vocab.filter((v) => v.id !== item.id);
		const wrong = shuffle(others).slice(0, 3).map((v) => v.meaning);
		return shuffle([item.meaning, ...wrong]);
	}

	function nextTestQuestion() {
		if (testQueue.length === 0) {
			testCurrent = null;
			return;
		}
		testCurrent = testQueue.shift() ?? null;
		testInput = '';
		testFeedback = 'none';
		if (testCurrent?.type === 'pronunciation') {
			requestAnimationFrame(() => inputEl?.focus());
		}
	}

	function submitTest() {
		if (testFeedback !== 'none' || !testCurrent || !deck) return;

		let correct: boolean;
		if (testCurrent.type === 'pronunciation') {
			const answer = testInput.trim().toLowerCase();
			correct = answer === testCurrent.item.romaji;
		} else {
			correct = testInput === testCurrent.item.meaning;
		}

		testFeedback = correct ? 'correct' : 'wrong';
		testCount++;
		if (correct) testCorrect++;
		deck.review(testCurrent.item.id, correct ? 5 : 0);
	}

	function selectChoice(choice: string) {
		if (testFeedback !== 'none' || !testCurrent) return;
		testInput = choice;
		submitTest();
	}

	function handleTestKey(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			if (testFeedback !== 'none') {
				nextTestQuestion();
			} else if (testCurrent?.type === 'pronunciation') {
				submitTest();
			}
		}
	}

	function backToSelect() {
		mode = 'select';
		deck = null;
		studyQueue = [];
		studyId = null;
		studyItem = null;
		testQueue = [];
		testCurrent = null;
	}
</script>

<svelte:window onkeydown={mode === 'study' ? handleStudyKey : mode === 'test' ? handleTestKey : undefined} />

{#if mode === 'select'}
	<div class="select-screen">
		<h1>N5 Vocab</h1>
		<p class="subtitle">Choose a study mode</p>
		<button onclick={startStudy} class="mode-btn">
			<span class="mode-label">Flashcards</span>
			<span class="mode-sample">Flip cards to study</span>
		</button>
		<button onclick={startTest} class="mode-btn">
			<span class="mode-label">Test</span>
			<span class="mode-sample">Pronunciation & meaning</span>
		</button>
		<a href="/" class="back-link">← Home</a>
	</div>
{:else if mode === 'study'}
	{#if studyId === null}
		<div class="done-screen">
			<h1>Study Complete</h1>
			<p class="score">{studyCount} cards reviewed</p>
			<button onclick={startStudy} class="action-btn">Study Again</button>
			<button onclick={backToSelect} class="action-btn secondary">Back</button>
			<a href="/" class="back-link">← Home</a>
		</div>
	{:else}
		<div class="study-screen">
			<div class="quiz-header">
				<button onclick={backToSelect} class="back-btn">←</button>
				<span class="counter">{studyCount} reviewed · {studyQueue.length} left</span>
			</div>

			<label class="toggle-row">
				<span class="toggle-label">Romaji</span>
				<input type="checkbox" bind:checked={showRomaji} class="toggle-input" />
				<span class="toggle-switch"></span>
			</label>

			<div
				class="card"
				class:flipped={studyFlipped}
				onclick={flipCard}
				role="button"
				tabindex="0"
			>
				<div class="card-face card-front">
					<div class="card-word">{studyItem?.word}</div>
					{#if showRomaji && studyItem?.word !== studyItem?.kana}
						<div class="card-kana">{studyItem?.kana}</div>
					{/if}
					{#if showRomaji}
						<div class="card-romaji">{studyItem?.romaji}</div>
					{/if}
					<div class="card-hint">click / space to flip</div>
				</div>
				<div class="card-face card-back">
					<div class="card-meaning">{studyItem?.meaning}</div>
					<div class="card-hint">did you know it?</div>
				</div>
			</div>

			{#if studyFlipped}
				<div class="study-buttons">
					<button onclick={() => studyRate(false)} class="rate-btn rate-wrong">
						Didn't know
					</button>
					<button onclick={() => studyRate(true)} class="rate-btn rate-correct">
						Knew it
					</button>
				</div>
			{/if}
		</div>
	{/if}
{:else if mode === 'test'}
	{#if testCurrent === null}
		<div class="done-screen">
			<h1>Test Complete</h1>
			<p class="score">{testCorrect} / {testCount} correct</p>
			<button onclick={startTest} class="action-btn">Test Again</button>
			<button onclick={backToSelect} class="action-btn secondary">Back</button>
			<a href="/" class="back-link">← Home</a>
		</div>
	{:else}
		<div class="test-screen">
			<div class="quiz-header">
				<button onclick={backToSelect} class="back-btn">←</button>
				<span class="counter">{testCount} done · {testQueue.length} left</span>
			</div>

			<div class="test-type-badge">
				{testCurrent.type === 'pronunciation' ? 'Type the pronunciation (romaji)' : 'Select the correct meaning'}
			</div>

			<div class="char-display">{testCurrent.item.word}</div>
			{#if testCurrent.item.word !== testCurrent.item.kana}
				<div class="card-kana">{testCurrent.item.kana}</div>
			{/if}

			{#if testFeedback === 'none'}
				{#if testCurrent.type === 'pronunciation'}
					<input
						bind:this={inputEl}
						bind:value={testInput}
						onkeydown={handleTestKey}
						placeholder="type romaji..."
						class="answer-input"
						autocomplete="off"
						autocapitalize="none"
						spellcheck="false"
					/>
					<button onclick={submitTest} class="action-btn" disabled={!testInput.trim()}>
						Check
					</button>
				{:else}
					<div class="choices">
						{#each testCurrent.choices ?? [] as choice}
							<button
								onclick={() => selectChoice(choice)}
								class="choice-btn"
							>
								{choice}
							</button>
						{/each}
					</div>
				{/if}
			{:else}
				<div class="feedback {testFeedback}">
					{#if testFeedback === 'correct'}
						✓ Correct!
					{:else}
						✗ {#if testCurrent.type === 'pronunciation'}
							Correct: {testCurrent.item.romaji}
						{:else}
							Correct: {testCurrent.item.meaning}
						{/if}
					{/if}
				</div>
				<button onclick={nextTestQuestion} class="action-btn">Next →</button>
			{/if}
		</div>
	{/if}
{/if}

<style>
	.select-screen,
	.done-screen,
	.study-screen,
	.test-screen {
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
		width: 100%;
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

	/* Toggle switch */
	.toggle-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		align-self: flex-end;
	}

	.toggle-label {
		font-size: 0.85rem;
		color: var(--text-secondary);
	}

	.toggle-input {
		display: none;
	}

	.toggle-switch {
		width: 36px;
		height: 20px;
		border-radius: 10px;
		background: var(--border);
		position: relative;
		transition: background 0.2s;
	}

	.toggle-switch::after {
		content: '';
		position: absolute;
		top: 2px;
		left: 2px;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: white;
		transition: transform 0.2s;
	}

	.toggle-input:checked + .toggle-switch {
		background: var(--primary);
	}

	.toggle-input:checked + .toggle-switch::after {
		transform: translateX(16px);
	}

	/* Flashcard */
	.card {
		width: 100%;
		min-height: 280px;
		perspective: 1000px;
		cursor: pointer;
		position: relative;
	}

	.card-face {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		backface-visibility: hidden;
		transition: transform 0.4s;
		padding: 1.5rem;
	}

	.card-front {
		transform: rotateY(0deg);
	}

	.card-back {
		transform: rotateY(180deg);
	}

	.card.flipped .card-front {
		transform: rotateY(-180deg);
	}

	.card.flipped .card-back {
		transform: rotateY(0deg);
	}

	.card-word {
		font-size: 3.5rem;
		font-weight: 600;
	}

	.card-kana {
		font-size: 1.25rem;
		color: var(--text-secondary);
	}

	.card-romaji {
		font-size: 1rem;
		color: var(--text-secondary);
		font-style: italic;
	}

	.card-meaning {
		font-size: 1.75rem;
		font-weight: 600;
		text-align: center;
	}

	.card-hint {
		font-size: 0.75rem;
		color: var(--text-secondary);
		opacity: 0.6;
		margin-top: auto;
	}

	.study-buttons {
		display: flex;
		gap: 0.75rem;
		width: 100%;
	}

	.rate-btn {
		flex: 1;
		padding: 0.75rem;
		border: none;
		border-radius: var(--radius);
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		font-family: inherit;
	}

	.rate-correct {
		background: #22c55e20;
		color: #22c55e;
		border: 1px solid #22c55e40;
	}

	.rate-wrong {
		background: #ef444420;
		color: #ef4444;
		border: 1px solid #ef444440;
	}

	/* Test mode */
	.test-type-badge {
		font-size: 0.8rem;
		color: var(--text-secondary);
		text-align: center;
		padding: 0.4rem 0.75rem;
		background: var(--surface);
		border-radius: 8px;
	}

	.char-display {
		font-size: 4rem;
		line-height: 1.2;
		text-align: center;
		margin: 0.5rem 0;
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

	.choices {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 100%;
	}

	.choice-btn {
		padding: 0.75rem 1rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		cursor: pointer;
		font-family: inherit;
		font-size: 1rem;
		color: var(--text);
		transition: border-color 0.15s;
	}

	.choice-btn:hover {
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
