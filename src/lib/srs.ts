export type CardState = {
	id: string;
	easeFactor: number;
	interval: number; // days
	repetitions: number;
	dueDate: number; // timestamp (ms)
};

const DEFAULT_EASE = 2.5;
const DAY_MS = 24 * 60 * 60 * 1000;

function loadStates(prefix: string): Record<string, CardState> {
	if (typeof localStorage === 'undefined') return {};
	try {
		const raw = localStorage.getItem(`srs:${prefix}`);
		return raw ? JSON.parse(raw) : {};
	} catch {
		return {};
	}
}

function saveStates(prefix: string, states: Record<string, CardState>) {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(`srs:${prefix}`, JSON.stringify(states));
}

function makeDefault(id: string): CardState {
	return {
		id,
		easeFactor: DEFAULT_EASE,
		interval: 0,
		repetitions: 0,
		dueDate: Date.now(),
	};
}

/**
 * SM-2 algorithm update.
 * quality: 0-5 (0-3 = incorrect, 4-5 = correct)
 * Returns updated state.
 */
export function updateCard(state: CardState, quality: number): CardState {
	let { easeFactor, interval, repetitions } = state;

	if (quality < 3) {
		repetitions = 0;
		interval = 1;
	} else {
		if (repetitions === 0) {
			interval = 1;
		} else if (repetitions === 1) {
			interval = 6;
		} else {
			interval = Math.round(interval * easeFactor);
		}
		repetitions += 1;
	}

	easeFactor = Math.max(
		1.3,
		easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
	);

	return {
		...state,
		easeFactor,
		interval,
		repetitions,
		dueDate: Date.now() + interval * DAY_MS,
	};
}

export class SRSDeck {
	private prefix: string;
	private states: Record<string, CardState>;

	constructor(prefix: string) {
		this.prefix = prefix;
		this.states = loadStates(prefix);
	}

	getState(id: string): CardState {
		return this.states[id] ?? makeDefault(id);
	}

	isDue(id: string): boolean {
		const state = this.getState(id);
		return Date.now() >= state.dueDate;
	}

	/**
	 * Returns IDs of cards that are due for review.
	 * If no cards are due, returns all cards (new session).
	 */
	getDueCards(ids: string[]): string[] {
		const due = ids.filter((id) => this.isDue(id));
		return due.length > 0 ? due : ids;
	}

	review(id: string, quality: number): CardState {
		const state = this.getState(id);
		const updated = updateCard(state, quality);
		this.states[id] = updated;
		saveStates(this.prefix, this.states);
		return updated;
	}

	reset() {
		this.states = {};
		saveStates(this.prefix, this.states);
	}
}
