<script lang="ts">
	import { goto } from '$app/navigation';
	import { n4Vocab, n5Vocab as n5Data, type VocabItem } from '$lib/data/vocab';
	import { SRSDeck } from '$lib/srs';

	type Mode = 'select' | 'study' | 'test';
	type TestType = 'reading' | 'meaning';
	type TestQuestion = {
		item: VocabItem;
		type: TestType;
		choices?: string[];
	};
	type Level = 'n5' | 'n4';
	type MenuStage = 'levels' | 'options';
	type StudyRating = 'again' | 'hard' | 'good' | 'easy';
	type VocabProgress = {
		seen: number;
		correct: number;
		incorrect: number;
		hard: number;
		again: number;
		streak: number;
		lastReviewedAt: number;
	};

	let mode = $state<Mode>('select');
	let menuStage = $state<MenuStage>('levels');
	let selectedLevel = $state<Level>('n5');
	let deck = $state<SRSDeck | null>(null);
	let showRomaji = $state(true);

	// Study state
	let studyQueue = $state<string[]>([]);
	let studyId = $state<string | null>(null);
	let studyItem = $state<VocabItem | null>(null);
	let studyFlipped = $state(false);
	let studyCount = $state(0);
	let missedVocabCount = $state(0);

	// Test state
	let testQueue = $state<TestQuestion[]>([]);
	let testCurrent = $state<TestQuestion | null>(null);
	let testInput = $state('');
	let testFeedback = $state<'none' | 'correct' | 'wrong'>('none');
	let testCount = $state(0);
	let testCorrect = $state(0);
	let testRetried = $state<string[]>([]);
	let inputEl = $state<HTMLInputElement | null>(null);

	function getVocab(): VocabItem[] {
		return selectedLevel === 'n4' ? n4Vocab : n5Data;
	}

	function selectLevel(level: Level) {
		selectedLevel = level;
		menuStage = 'options';
		missedVocabCount = getMissedIds(loadProgress()).length;
	}

	function isBackKey(e: KeyboardEvent) {
		const tag = (e.target as HTMLElement | null)?.tagName;
		return e.key === 'Escape' || (e.key.toLowerCase() === 'h' && tag !== 'INPUT' && tag !== 'TEXTAREA');
	}

	function progressKey() {
		return `vocab:progress:${selectedLevel}`;
	}

	function shuffle<T>(arr: T[]): T[] {
		const copy = [...arr];
		for (let i = copy.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[copy[i], copy[j]] = [copy[j], copy[i]];
		}
		return copy;
	}

	function getItem(id: string): VocabItem | undefined {
		return getVocab().find((v) => v.id === id);
	}

	function loadProgress(): Record<string, VocabProgress> {
		if (typeof localStorage === 'undefined') return {};
		try {
			const raw = localStorage.getItem(progressKey());
			return raw ? JSON.parse(raw) : {};
		} catch {
			return {};
		}
	}

	function saveProgress(progress: Record<string, VocabProgress>) {
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem(progressKey(), JSON.stringify(progress));
		}
	}

	function recordProgress(id: string, rating: StudyRating) {
		const progress = loadProgress();
		const current = progress[id] ?? {
			seen: 0,
			correct: 0,
			incorrect: 0,
			hard: 0,
			again: 0,
			streak: 0,
			lastReviewedAt: 0,
		};
		const successful = rating === 'good' || rating === 'easy';
		progress[id] = {
			...current,
			seen: current.seen + 1,
			correct: current.correct + (successful ? 1 : 0),
			incorrect: current.incorrect + (rating === 'again' ? 1 : 0),
			hard: current.hard + (rating === 'hard' ? 1 : 0),
			again: current.again + (rating === 'again' ? 1 : 0),
			streak: successful ? current.streak + 1 : 0,
			lastReviewedAt: Date.now(),
		};
		saveProgress(progress);
	}

	function studyWeight(id: string, progress: Record<string, VocabProgress>): number {
		if (!deck) return 1;
		const state = deck.getState(id);
		const stats = progress[id];
		if (!stats || stats.seen === 0) return 3;
		const overdueDays = Math.max(0, (Date.now() - state.dueDate) / 86_400_000);
		const missRate = stats.incorrect / stats.seen;
		const recentDifficulty = (stats.again + stats.hard) / stats.seen;
		return 1 + overdueDays + missRate * 8 + recentDifficulty * 4;
	}

	function weightedPick(ids: string[], count: number, progress: Record<string, VocabProgress>): string[] {
		const pool = [...ids];
		const picked: string[] = [];
		while (pool.length > 0 && picked.length < count) {
			const totalWeight = pool.reduce((sum, id) => sum + studyWeight(id, progress), 0);
			let target = Math.random() * totalWeight;
			const index = pool.findIndex((id) => {
				target -= studyWeight(id, progress);
				return target <= 0;
			});
			picked.push(pool.splice(index < 0 ? 0 : index, 1)[0]);
		}
		return picked;
	}

	function getMissedIds(progress: Record<string, VocabProgress>): string[] {
		return getVocab()
			.map((item) => item.id)
			.filter((id) => (progress[id]?.incorrect ?? 0) > 0 || (progress[id]?.hard ?? 0) > 0);
	}

	function buildStudyQueue(missedOnly = false): string[] {
		if (!deck) return [];
		const progress = loadProgress();
		const missedIds = getMissedIds(progress);
		if (missedOnly) return weightedPick(missedIds, 15, progress);
		const newIds = getVocab()
			.filter((item) => deck!.getState(item.id).repetitions === 0 && !progress[item.id]?.seen)
			.map((item) => item.id);
		const reviewedIds = getVocab()
			.filter((item) => !newIds.includes(item.id))
			.map((item) => item.id)
			.filter((id) => deck!.isDue(id) || missedIds.includes(id));
		const newCards = shuffle(newIds).slice(0, 5);
		const reviewedCards = weightedPick(reviewedIds, Math.max(0, 15 - newCards.length), progress);
		return shuffle([...newCards, ...reviewedCards]);
	}

	// --- Study mode ---
	function startStudy(missedOnly = false) {
		deck = new SRSDeck(`vocab:${selectedLevel}`);
		studyQueue = buildStudyQueue(missedOnly);
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

	function handleCardKey(e: KeyboardEvent) {
		if (e.key === ' ' || e.key === 'Enter') {
			e.preventDefault();
			e.stopPropagation();
			flipCard();
		}
	}

	function studyRate(rating: StudyRating) {
		if (!deck || !studyId) return;
		const quality = rating === 'again' ? 0 : rating === 'hard' ? 3 : rating === 'good' ? 4 : 5;
		deck.review(studyId, quality);
		recordProgress(studyId, rating);
		if (rating === 'again' || rating === 'hard') {
			studyQueue.splice(Math.min(rating === 'again' ? 2 : 4, studyQueue.length), 0, studyId);
		}
		nextStudyCard();
	}

	function handleStudyKey(e: KeyboardEvent) {
		if (isBackKey(e)) {
			e.preventDefault();
			backToSelect();
			return;
		}
		if (studyFlipped && ['1', '2', '3', '4'].includes(e.key)) {
			e.preventDefault();
			studyRate(({ '1': 'again', '2': 'hard', '3': 'good', '4': 'easy' } as Record<string, StudyRating>)[e.key]);
			return;
		}
		if (e.key === ' ' || e.key === 'Enter') {
			e.preventDefault();
			if (studyFlipped) {
				studyRate('good');
			} else {
				flipCard();
			}
		}
	}

	// --- Test mode ---
	function startTest(missedOnly = false) {
		deck = new SRSDeck(`vocab:${selectedLevel}`);
		const progress = loadProgress();
		const availableIds = missedOnly ? getMissedIds(progress) : getVocab().map((v) => v.id);
		const ids = weightedPick(availableIds, availableIds.length, progress);
		testQueue = ids.map((id) => {
			const item = getItem(id)!;
			const stats = progress[id];
			const type: TestType = item.word !== item.kana && (stats?.correct ?? 0) >= 2 && Math.random() < 0.4 ? 'reading' : 'meaning';
			return { item, type, choices: type === 'meaning' ? makeChoices(item) : undefined };
		});
		testCount = 0;
		testCorrect = 0;
		testRetried = [];
		testFeedback = 'none';
		testInput = '';
		mode = 'test';
		nextTestQuestion();
	}

	function makeChoices(item: VocabItem): string[] {
		const others = getVocab().filter((v) => v.id !== item.id);
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
		if (testCurrent?.type === 'reading') {
			requestAnimationFrame(() => inputEl?.focus());
		}
	}

	function submitTest() {
		if (testFeedback !== 'none' || !testCurrent || !deck) return;

		let correct: boolean;
		if (testCurrent.type === 'reading') {
			const answer = testInput.trim();
			correct = answer === testCurrent.item.kana || answer.toLowerCase() === testCurrent.item.romaji;
		} else {
			correct = testInput === testCurrent.item.meaning;
		}

		testFeedback = correct ? 'correct' : 'wrong';
		testCount++;
		if (correct) testCorrect++;
		deck.review(testCurrent.item.id, correct ? 4 : 0);
		recordProgress(testCurrent.item.id, correct ? 'good' : 'again');
		if (!correct && !testRetried.includes(testCurrent.item.id)) {
			testRetried = [...testRetried, testCurrent.item.id];
			testQueue.splice(Math.min(3, testQueue.length), 0, testCurrent);
		}
	}

	function selectChoice(choice: string) {
		if (testFeedback !== 'none' || !testCurrent) return;
		testInput = choice;
		submitTest();
	}

	function handleTestKey(e: KeyboardEvent) {
		if (isBackKey(e)) {
			e.preventDefault();
			backToSelect();
			return;
		}
		if (testFeedback === 'none' && testCurrent?.type === 'meaning' && e.key >= '1' && e.key <= '4') {
			const choice = testCurrent.choices?.[Number(e.key) - 1];
			if (choice) selectChoice(choice);
			return;
		}
		if (testFeedback !== 'none' && (e.key === 'Enter' || e.key === ' ')) {
			e.preventDefault();
			nextTestQuestion();
		} else if (testFeedback === 'none' && (e.key === 'Enter' || e.key === ' ')) {
			e.preventDefault();
			if (testCurrent?.type === 'reading') submitTest();
		}
	}

	function handleKey(e: KeyboardEvent) {
		if (mode === 'study') return handleStudyKey(e);
		if (mode === 'test') return handleTestKey(e);
		if (menuStage === 'levels' && (e.key === '1' || e.key === '2')) {
			e.preventDefault();
			selectLevel(e.key === '1' ? 'n5' : 'n4');
			return;
		}
		if (menuStage === 'options' && e.key === '1') {
			e.preventDefault();
			startTest();
			return;
		}
		if (menuStage === 'options' && e.key === '2' && getMissedIds(loadProgress()).length > 0) {
			e.preventDefault();
			startTest(true);
			return;
		}
		if (isBackKey(e)) {
			e.preventDefault();
			if (menuStage === 'options') {
				menuStage = 'levels';
			} else {
				goto('/');
			}
		}
	}

	function backToSelect() {
		mode = 'select';
		menuStage = 'options';
		deck = null;
		studyQueue = [];
		studyId = null;
		studyItem = null;
		testQueue = [];
		testCurrent = null;
		missedVocabCount = getMissedIds(loadProgress()).length;
	}

	missedVocabCount = getMissedIds(loadProgress()).length;
</script>

<svelte:window onkeydown={handleKey} />

{#if mode === 'select'}
	<div class="select-screen">
			{#if menuStage === 'levels'}
		<h1>Vocab</h1>
		<p class="subtitle">Choose a level</p>
		<button onclick={() => selectLevel('n5')} class="mode-btn">
			<span class="mode-label"><span class="shortcut">1</span> N5 Vocab</span>
			<span class="mode-sample">Cycle every word and improve weak ones</span>
		</button>
		<button onclick={() => selectLevel('n4')} class="mode-btn">
			<span class="mode-label"><span class="shortcut">2</span> N4 Vocab</span>
			<span class="mode-sample">All N4 words</span>
		</button>
		<a href="/" class="back-link">← Home</a>
			{:else}
				<h1>{selectedLevel.toUpperCase()} Vocab</h1>
				<p class="subtitle">Choose a quiz</p>
				<button onclick={() => startTest()} class="mode-btn" disabled={getVocab().length === 0}>
					<span class="mode-label"><span class="shortcut">1</span> All {selectedLevel.toUpperCase()} Vocab</span>
					<span class="mode-sample">Cycle every word</span>
				</button>
				<button onclick={() => startTest(true)} class="mode-btn" disabled={getMissedIds(loadProgress()).length === 0}>
					<span class="mode-label"><span class="shortcut">2</span> Review</span>
					<span class="mode-sample">Weighted missed answers</span>
				</button>
				<p class="hint">H / Esc back</p>
			{/if}
		</div>
{:else if mode === 'study'}
	{#if studyId === null}
		<div class="done-screen">
			<h1>Study Complete</h1>
			<p class="score">{studyCount} cards reviewed</p>
			<button onclick={() => startStudy()} class="action-btn">Study Again</button>
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
				onkeydown={handleCardKey}
				role="button"
				tabindex="0"
			>
				<div class="card-face card-front">
					<div class="card-kana card-primary">{studyItem?.kana}</div>
					{#if studyItem?.word !== studyItem?.kana}
						<div class="card-kanji">{studyItem?.word}</div>
					{/if}
					{#if showRomaji}
						<div class="card-romaji">{studyItem?.romaji}</div>
					{/if}
					<div class="card-hint">click / space to reveal</div>
				</div>
				<div class="card-face card-back">
					<div class="card-meaning">{studyItem?.meaning}</div>
					<div class="card-kanji">{studyItem?.word}</div>
					<div class="card-hint">rate your answer</div>
				</div>
			</div>

			{#if studyFlipped}
				<div class="study-buttons">
					<button onclick={() => studyRate('again')} class="rate-btn rate-wrong">
						Again
					</button>
					<button onclick={() => studyRate('hard')} class="rate-btn rate-hard">
						Hard
					</button>
					<button onclick={() => studyRate('good')} class="rate-btn rate-correct">
						Good
					</button>
					<button onclick={() => studyRate('easy')} class="rate-btn rate-easy">
						Easy
					</button>
					</div>
					<p class="hint">1 Again · 2 Hard · 3 Good · 4 Easy · Esc back</p>
			{/if}
		</div>
	{/if}
{:else if mode === 'test'}
	{#if testCurrent === null}
		<div class="done-screen">
			<h1>Quiz Complete</h1>
			<p class="score">{testCorrect} / {testCount} correct</p>
			<button onclick={() => startTest()} class="action-btn">Quiz Again</button>
			<button onclick={backToSelect} class="action-btn secondary">Back</button>
			<a href="/" class="back-link">← Home</a>
		</div>
	{:else}
		<div class="test-screen">
			<div class="quiz-header">
				<button onclick={backToSelect} class="back-btn">←</button>
				<span class="counter">{testCount} done · {testQueue.length} left</span>
					<span class="shortcut-hint">H / Esc back</span>
			</div>

			<div class="test-type-badge">
				{testCurrent.type === 'reading' ? 'Type the reading (kana)' : 'Select the correct meaning'}
			</div>

			<div class="char-display">{testCurrent.type === 'reading' ? testCurrent.item.word : testCurrent.item.kana}</div>
			{#if testCurrent.item.word !== testCurrent.item.kana}
				<div class="card-kanji">{testCurrent.type === 'reading' ? testCurrent.item.kana : testCurrent.item.word}</div>
			{/if}

			{#if testFeedback === 'none'}
				{#if testCurrent.type === 'reading'}
					<input
						bind:this={inputEl}
						bind:value={testInput}
						onkeydown={handleTestKey}
						placeholder="type kana..."
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
						{#each testCurrent.choices ?? [] as choice, i}
							<button
								onclick={() => selectChoice(choice)}
								class="choice-btn"
							>
								<span class="choice-num">{i + 1}</span>{choice}
							</button>
						{/each}
					</div>
				{/if}
			{:else}
				<div class="feedback {testFeedback}">
					{#if testFeedback === 'correct'}
						✓ Correct!
					{:else}
						✗ {#if testCurrent.type === 'reading'}
							Correct: {testCurrent.item.kana}
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
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 1.2rem;
		font-weight: 600;
		color: var(--text);
	}

	.shortcut,
	.choice-num {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.5rem;
		height: 1.5rem;
		padding: 0 0.25rem;
		border: 1px solid var(--border);
		border-radius: 0.35rem;
		color: var(--text-secondary);
		font-size: 0.8rem;
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

	.card-primary {
		font-size: 3.5rem;
		font-weight: 600;
		color: var(--text);
	}

	.card-kanji {
		font-size: 1.5rem;
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

	.rate-hard {
		background: #f59e0b20;
		color: #f59e0b;
		border: 1px solid #f59e0b40;
	}

	.rate-easy {
		background: #06b6d420;
		color: #06b6d4;
		border: 1px solid #06b6d440;
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
		display: flex;
		align-items: center;
		gap: 0.75rem;
		text-align: left;
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
