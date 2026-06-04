import "./styles/main.css";
import { QUESTIONS } from "./data/questions";
import { CATEGORIES, QUESTION_TYPES, type Category, type Question } from "./data/types";
import { isCorrect, filterByCategories, seededShuffle } from "./lib/answer";
import { scoreAnswer, comboMultiplier, accuracyPercent, type RoundStats } from "./lib/scoring";
import { levelForXp, nextLevel, levelProgress } from "./lib/levels";
import {
  newCard,
  reviewCard,
  tickQueue,
  pickNext,
  masteredCount,
  mistakeIds as mistakeIdsPure,
  type CardState,
} from "./lib/srs";
import { loadProgress, saveProgress, resetProgress, type Progress } from "./lib/storage";
import { buildShareText } from "./lib/share";
import { updateStats, overallAccuracy, computeAccuracyByCategory } from "./lib/stats";
import { filterQuestions } from "./lib/study";

const QUESTIONS_PER_ROUND = 10;
const TIMER_MS = 25_000;

const app = document.getElementById("app")!;
let progress: Progress = loadProgress();

// ------- Accessibility helpers -------

/** Announce a message to assistive tech via the polite live region. */
function announce(msg: string): void {
  const el = document.getElementById("sr-status");
  if (!el) return;
  // Clearing first guarantees re-announcement of identical consecutive text.
  el.textContent = "";
  requestAnimationFrame(() => {
    el.textContent = msg;
  });
}

/**
 * Move keyboard focus to a screen's heading after a screen switch so screen
 * reader and keyboard users land on the new content instead of being stranded.
 */
function focusHeading(): void {
  const h = app.querySelector("h1, h2, h3") as HTMLElement | null;
  if (h) {
    h.setAttribute("tabindex", "-1");
    h.focus();
  } else {
    app.focus();
  }
}

// ------- Sound (correct/wrong feedback), persisted in localStorage. -------
const SOUND_KEY = "zakon-quest:sound:v1";
let soundEnabled = loadSoundPref();

function loadSoundPref(): boolean {
  try {
    // Default to on; only an explicit "0" disables sound.
    return localStorage.getItem(SOUND_KEY) !== "0";
  } catch {
    return true;
  }
}

function saveSoundPref(on: boolean): void {
  try {
    localStorage.setItem(SOUND_KEY, on ? "1" : "0");
  } catch {
    // ignore
  }
}

let audioCtx: AudioContext | null = null;
function playTone(correct: boolean): void {
  if (!soundEnabled) return;
  try {
    const Ctor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    audioCtx ??= new Ctor();
    const ctx = audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = correct ? "triangle" : "sawtooth";
    osc.frequency.value = correct ? 660 : 180;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
    if (correct) osc.frequency.exponentialRampToValueAtTime(990, ctx.currentTime + 0.18);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.26);
  } catch {
    // Audio may be blocked or unsupported — ignore.
  }
}

/** Ids of questions the player has gotten wrong (outstanding mistakes). */
function mistakeIds(): string[] {
  return mistakeIdsPure(
    progress.cards,
    QUESTIONS.map((q) => q.id),
  );
}

// ------- Round state -------
interface RoundState {
  queue: Question[];
  index: number;
  selectedCats: Set<Category>;
  useTimer: boolean;
  streak: number;
  bestStreak: number;
  correct: number;
  answered: number;
  score: number;
  answeredIds: Set<string>;
  /** True when replaying previously-missed questions ("review your mistakes"). */
  isReview: boolean;
}

let round: RoundState | null = null;
let timerHandle: number | null = null;
let timerStart = 0;
// True once the current question has been answered (until the next renders).
let questionAnswered = false;

// ===================== Screens =====================

function renderMenu(selected: Set<Category> = new Set()): void {
  stopTimer();
  const lvl = levelForXp(progress.xp);
  const next = nextLevel(progress.xp);
  const progPct = Math.round(levelProgress(progress.xp) * 100);
  const acc = accuracyPercent({ total: progress.totalAnswered, correct: progress.totalCorrect });
  const mastered = masteredCount(progress.cards);
  const mistakeCount = mistakeIds().length;

  app.innerHTML = `
    <h1 class="title">📜 Know the Law</h1>
    <p class="subtitle">A quiz about the basics of Russian law. Guess the code, the article, and tell myths from real norms.</p>

    <div class="disclaimer">
      ⚠️ This is an educational game, <b>not legal advice</b>. Legal norms change —
      verify against the current edition at
      <a href="http://pravo.gov.ru" target="_blank" rel="noopener">pravo.gov.ru</a>
      or in ConsultantPlus. After every answer, a reference to the norm is shown for self-checking.
    </div>

    <div class="card">
      <div class="hud">
        <div class="stat"><span class="label">Rank</span><span class="value">${lvl.title}</span></div>
        <div class="stat"><span class="label">XP</span><span class="value">${progress.xp}</span></div>
        <div class="level-bar">
          <span class="label" style="font-size:.7rem;color:var(--muted)">${
            next ? `to "${next.title}"` : "maximum level"
          }</span>
          <div class="track"><div class="fill" style="width:${progPct}%"></div></div>
        </div>
      </div>
      <div class="hud">
        <div class="stat"><span class="label">Accuracy</span><span class="value">${acc}%</span></div>
        <div class="stat"><span class="label">Answered</span><span class="value">${progress.totalAnswered}</span></div>
        <div class="stat"><span class="label">Mastered</span><span class="value">${mastered}/${QUESTIONS.length}</span></div>
      </div>
    </div>

    <div class="card">
      <h3>Choose branches of law</h3>
      <div class="chips" id="cats"></div>
      <p class="chip-hint">Nothing selected — we play across all branches.</p>
      <label class="chip-hint" style="display:flex;gap:8px;align-items:center;margin-top:12px;cursor:pointer">
        <input type="checkbox" id="timer" checked /> Enable the timer (speed bonus)
      </label>
      <label class="chip-hint" style="display:flex;gap:8px;align-items:center;margin-top:8px;cursor:pointer">
        <input type="checkbox" id="sound" ${soundEnabled ? "checked" : ""} /> Sound effects
      </label>
      <div style="height:14px"></div>
      <button class="btn" id="start" data-testid="start-quiz">▶ Play (${QUESTIONS_PER_ROUND} questions)</button>
      ${
        mistakeCount > 0
          ? `<div style="height:10px"></div><button class="btn secondary" id="review">🔁 Review your mistakes (${mistakeCount})</button>`
          : ""
      }
      <div style="height:10px"></div>
      <button class="btn secondary" id="stats">📊 Stats</button>
      <div style="height:10px"></div>
      <button class="btn secondary" id="study" data-testid="open-study">📚 Study (browse all questions)</button>
      <div style="height:10px"></div>
      <button class="btn ghost" id="reset">Reset progress</button>
      <p class="chip-hint" style="margin-top:12px">Keyboard: press 1–4 to answer, Enter to continue.</p>
    </div>

    <footer>
      Open source · MIT · hosted on GitHub Pages · works offline, no data collection.<br />
      Progress is stored only in this browser (localStorage).
    </footer>
  `;

  const catsEl = app.querySelector("#cats")!;
  (Object.keys(CATEGORIES) as Category[]).forEach((cat) => {
    const btn = document.createElement("button");
    btn.className = "chip";
    btn.setAttribute("aria-pressed", String(selected.has(cat)));
    btn.innerHTML = `${CATEGORIES[cat].emoji} ${CATEGORIES[cat].title}`;
    btn.addEventListener("click", () => {
      if (selected.has(cat)) selected.delete(cat);
      else selected.add(cat);
      btn.setAttribute("aria-pressed", String(selected.has(cat)));
    });
    catsEl.appendChild(btn);
  });

  const soundEl = app.querySelector("#sound") as HTMLInputElement;
  soundEl.addEventListener("change", () => {
    soundEnabled = soundEl.checked;
    saveSoundPref(soundEnabled);
    if (soundEnabled) playTone(true);
  });

  app.querySelector("#start")!.addEventListener("click", () => {
    const useTimer = (app.querySelector("#timer") as HTMLInputElement).checked;
    startRound(selected, useTimer);
  });

  const reviewBtn = app.querySelector("#review");
  if (reviewBtn) {
    reviewBtn.addEventListener("click", () => {
      const useTimer = (app.querySelector("#timer") as HTMLInputElement).checked;
      startReview(useTimer);
    });
  }

  app.querySelector("#stats")!.addEventListener("click", () => renderStats());

  app.querySelector("#study")!.addEventListener("click", () => renderStudy());

  app.querySelector("#reset")!.addEventListener("click", () => {
    if (confirm("Reset all progress, XP and mastered questions?")) {
      resetProgress();
      progress = loadProgress();
      renderMenu();
      toast("Progress reset");
      announce("Progress reset");
    }
  });

  focusHeading();
}

// ===================== Stats / Profile screen =====================

function renderStats(): void {
  stopTimer();
  const lvl = levelForXp(progress.xp);
  const next = nextLevel(progress.xp);
  const progPct = Math.round(levelProgress(progress.xp) * 100);
  const acc = overallAccuracy(progress.stats);
  const byCat = computeAccuracyByCategory(progress.stats);

  const catRows =
    byCat.length === 0
      ? `<p class="chip-hint">No answers yet — play a round to build your stats.</p>`
      : byCat
          .map((r) => {
            const meta = CATEGORIES[r.category];
            return `
            <div class="cat-stat">
              <div class="cat-stat-head">
                <span class="cat-stat-name">${meta.emoji} ${escapeHtml(meta.title)}</span>
                <span class="cat-stat-num">${r.accuracy}% · ${r.correct}/${r.total}</span>
              </div>
              <div class="track"><div class="fill" style="width:${r.accuracy}%"></div></div>
            </div>`;
          })
          .join("");

  app.innerHTML = `
    <h1 class="title">📊 Your Stats</h1>
    <p class="subtitle">Lifetime progress, stored only in this browser.</p>

    <div class="card">
      <div class="result-grid">
        <div class="result-cell"><div class="big">${progress.stats.totalAnswered}</div><div class="lbl">Answered</div></div>
        <div class="result-cell"><div class="big">${acc}%</div><div class="lbl">Accuracy</div></div>
        <div class="result-cell"><div class="big">🔥 ${progress.stats.bestStreak}</div><div class="lbl">Best streak</div></div>
        <div class="result-cell"><div class="big">${progress.stats.totalCorrect}</div><div class="lbl">Correct</div></div>
      </div>

      <div class="hud" style="margin-top:6px">
        <div class="stat"><span class="label">Rank</span><span class="value">${lvl.title}</span></div>
        <div class="stat"><span class="label">XP</span><span class="value">${progress.xp}</span></div>
        <div class="level-bar">
          <span class="label" style="font-size:.7rem;color:var(--muted)">${
            next ? `to "${next.title}"` : "maximum level"
          }</span>
          <div class="track"><div class="fill" style="width:${progPct}%"></div></div>
        </div>
      </div>
    </div>

    <div class="card">
      <h3>Accuracy by category</h3>
      <div class="cat-stats">${catRows}</div>
    </div>

    <button class="btn ghost" id="back">← Back</button>
  `;

  app.querySelector("#back")!.addEventListener("click", () => renderMenu());

  focusHeading();
}

// ===================== Study / Browse screen =====================

function renderStudy(): void {
  stopTimer();
  round = null;

  const total = QUESTIONS.length;
  const catOptions = (Object.keys(CATEGORIES) as Category[])
    .map((c) => `<option value="${c}">${escapeHtml(CATEGORIES[c].title)}</option>`)
    .join("");

  app.innerHTML = `
    <h1 class="title">📚 Study</h1>
    <p class="subtitle">Browse every question with its correct answer, explanation and citation — no timer, no scoring.</p>

    <div class="card">
      <input
        type="search"
        id="study-search"
        class="study-search"
        data-testid="study-search"
        placeholder="Search prompt, explanation, citation, category…"
        aria-label="Search questions"
        autocomplete="off"
      />
      <div class="study-controls">
        <label class="chip-hint" for="study-cat" style="display:flex;gap:8px;align-items:center;margin:0">
          Category:
          <select id="study-cat" class="study-cat" aria-label="Filter by category">
            <option value="">All</option>
            ${catOptions}
          </select>
        </label>
        <span
          class="study-count chip-hint"
          id="study-count"
          role="status"
          aria-live="polite"
          style="margin:0;margin-left:auto"
        ></span>
      </div>
    </div>

    <div id="study-list" data-testid="study-list"></div>

    <div style="height:10px"></div>
    <button class="btn ghost" id="study-back" data-testid="study-back">← Back</button>
  `;

  const searchEl = app.querySelector("#study-search") as HTMLInputElement;
  const catEl = app.querySelector("#study-cat") as HTMLSelectElement;
  const listEl = app.querySelector("#study-list") as HTMLElement;
  const countEl = app.querySelector("#study-count") as HTMLElement;

  function update(): void {
    const cat = (catEl.value || null) as Category | null;
    const results = filterQuestions(QUESTIONS, searchEl.value, cat);
    countEl.textContent = `Showing ${results.length} of ${total}`;

    if (results.length === 0) {
      listEl.innerHTML = `<div class="card"><p class="chip-hint" style="margin:0">No questions match your search.</p></div>`;
      return;
    }

    listEl.innerHTML = results
      .map((q) => {
        const meta = CATEGORIES[q.category];
        const correct = q.options[q.correctIndex];
        return `
        <div class="card study-item" data-testid="study-item">
          <div class="q-meta">
            <span class="tag">${meta.emoji} ${escapeHtml(meta.title)}</span>
            <span class="tag">${escapeHtml(QUESTION_TYPES[q.type].title)}</span>
          </div>
          <div class="prompt">${escapeHtml(q.prompt)}</div>
          <div class="study-answer">✅ <b>Correct answer:</b> ${escapeHtml(correct)}</div>
          <div class="explanation">${escapeHtml(q.explanation)}</div>
          <div class="citation">📖 ${escapeHtml(q.citation)}</div>
        </div>`;
      })
      .join("");
  }

  searchEl.addEventListener("input", update);
  catEl.addEventListener("change", update);
  app.querySelector("#study-back")!.addEventListener("click", () => renderMenu());

  update();
  searchEl.focus();
}

function startRound(selectedCats: Set<Category>, useTimer: boolean): void {
  const pool = filterByCategories(QUESTIONS, selectedCats);
  // Starting queue: prioritise SRS questions, then top up via seeded shuffle.
  const poolIds = pool.map((q) => q.id);
  const byId = new Map(pool.map((q) => [q.id, q]));
  const ordered: Question[] = [];
  const used = new Set<string>();
  const seed = Date.now() & 0xffffffff;
  const shuffled = seededShuffle(poolIds, seed);
  const cardsCopy = { ...progress.cards };

  // First — overdue mistakes/new questions via pickNext, then the remainder.
  for (let i = 0; i < QUESTIONS_PER_ROUND && ordered.length < pool.length; i++) {
    const next = pickNext(
      shuffled.filter((id) => !used.has(id)),
      cardsCopy,
    );
    if (!next) break;
    used.add(next);
    ordered.push(byId.get(next)!);
  }
  // If there are fewer than QUESTIONS_PER_ROUND questions, play however many there are.

  beginRound(ordered, selectedCats, useTimer, false);
}

/**
 * "Review your mistakes" mode: replay only questions the player previously got
 * wrong (non-mastered SRS cards), shuffled. Falls back to the menu if none.
 */
function startReview(useTimer: boolean): void {
  const ids = new Set(mistakeIds());
  const pool = QUESTIONS.filter((q) => ids.has(q.id));
  if (pool.length === 0) {
    toast("No mistakes to review — nice work!");
    return;
  }
  const seed = Date.now() & 0xffffffff;
  const order = seededShuffle(
    pool.map((q) => q.id),
    seed,
  );
  const byId = new Map(pool.map((q) => [q.id, q]));
  const ordered = order.slice(0, QUESTIONS_PER_ROUND).map((id) => byId.get(id)!);
  beginRound(ordered, new Set<Category>(), useTimer, true);
}

function beginRound(queue: Question[], selectedCats: Set<Category>, useTimer: boolean, isReview: boolean): void {
  round = {
    queue,
    index: 0,
    selectedCats,
    useTimer,
    streak: 0,
    bestStreak: 0,
    correct: 0,
    answered: 0,
    score: 0,
    answeredIds: new Set(),
    isReview,
  };
  renderQuestion();
}

function renderQuestion(): void {
  if (!round) return renderMenu();
  if (round.index >= round.queue.length) return renderResults();

  stopTimer();
  questionAnswered = false;
  const q = round.queue[round.index];

  app.innerHTML = `
    <div class="hud">
      <div class="stat"><span class="label">Score</span><span class="value" id="score">${round.score}</span></div>
      <div class="stat"><span class="label">Streak</span><span class="value">${
        round.streak > 0 ? `🔥 ${round.streak}` : "—"
      }</span></div>
      <div class="stat" style="margin-left:auto;text-align:right">
        <span class="label">Multiplier</span><span class="value">×${comboMultiplier(round.streak + 1)}</span>
      </div>
    </div>

    <div class="card" id="qcard">
      <div class="q-meta">
        <span class="tag">${CATEGORIES[q.category].emoji} ${CATEGORIES[q.category].title}</span>
        <span class="tag">${QUESTION_TYPES[q.type].title}</span>
        ${round.isReview ? `<span class="tag">🔁 Review</span>` : ""}
        <span class="q-progress">Question ${round.index + 1} of ${round.queue.length}</span>
        ${
          round.useTimer
            ? `<span class="timer" id="timer" role="timer" aria-label="Time remaining">${(TIMER_MS / 1000) | 0}s</span>`
            : ""
        }
      </div>
      <h2 class="prompt" id="prompt">${escapeHtml(q.prompt)}</h2>
      <div class="options" id="options" role="group" aria-labelledby="prompt"></div>
      <div id="fb"></div>
      <div id="cont"></div>
    </div>
    <button class="btn ghost" id="quit" aria-label="End the current round">End round</button>
  `;

  const optionsEl = app.querySelector("#options")!;
  q.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.className = "option";
    btn.setAttribute("aria-label", `Answer ${i + 1}: ${opt}`);
    btn.innerHTML = `<span class="key" aria-hidden="true">${String.fromCharCode(65 + i)}</span><span>${escapeHtml(
      opt,
    )}</span>`;
    btn.addEventListener("click", () => answer(q, i));
    optionsEl.appendChild(btn);
  });

  app.querySelector("#quit")!.addEventListener("click", () => renderResults());

  // Move focus to the question so screen-reader users land on the new prompt.
  const promptEl = app.querySelector("#prompt") as HTMLElement | null;
  if (promptEl) {
    promptEl.setAttribute("tabindex", "-1");
    promptEl.focus();
  }
  announce(`Question ${round.index + 1} of ${round.queue.length}. ${q.prompt}`);

  if (round.useTimer) startTimer(q);
}

function startTimer(q: Question): void {
  timerStart = Date.now();
  const el = app.querySelector("#timer") as HTMLElement | null;
  timerHandle = window.setInterval(() => {
    const remaining = TIMER_MS - (Date.now() - timerStart);
    if (el) {
      const sec = Math.max(0, Math.ceil(remaining / 1000));
      el.textContent = `${sec}s`;
      el.classList.toggle("low", sec <= 5);
    }
    if (remaining <= 0) {
      stopTimer();
      // Time is up — counts as a wrong answer (index out of range).
      answer(q, -1);
    }
  }, 200);
}

function stopTimer(): void {
  if (timerHandle !== null) {
    clearInterval(timerHandle);
    timerHandle = null;
  }
}

function answer(q: Question, selectedIndex: number): void {
  if (!round) return;
  if (questionAnswered) return;
  questionAnswered = true;
  stopTimer();
  const correct = selectedIndex >= 0 && isCorrect(q, selectedIndex);
  const remainingMs = round.useTimer ? Math.max(0, TIMER_MS - (Date.now() - timerStart)) : 0;

  playTone(correct);

  // Update streak and score.
  round.streak = correct ? round.streak + 1 : 0;
  round.bestStreak = Math.max(round.bestStreak, round.streak);
  const gained = scoreAnswer({
    correct,
    difficulty: q.difficulty,
    streak: round.streak,
    remainingMs,
    totalMs: round.useTimer ? TIMER_MS : 0,
  });
  round.score += gained;
  round.answered += 1;
  if (correct) round.correct += 1;
  round.answeredIds.add(q.id);

  // Update the SRS card and the global progress.
  const card: CardState = progress.cards[q.id] ?? newCard(q.id);
  progress.cards[q.id] = reviewCard(card, correct);
  progress.cards = Object.fromEntries(tickQueue(Object.values(progress.cards)).map((c) => [c.id, c]));
  progress.xp += gained;
  progress.totalAnswered += 1;
  if (correct) progress.totalCorrect += 1;
  progress.bestStreak = Math.max(progress.bestStreak, round.bestStreak);
  // Lifetime stats (incl. per-category accuracy) via a pure aggregator.
  progress.stats = updateStats(progress.stats, {
    category: q.category,
    correct,
    streak: round.streak,
  });
  saveProgress(progress);

  // Highlight the options.
  const btns = Array.from(app.querySelectorAll(".option")) as HTMLButtonElement[];
  btns.forEach((b, i) => {
    b.disabled = true;
    if (i === q.correctIndex) b.classList.add("correct");
    else if (i === selectedIndex) b.classList.add("wrong");
  });

  const scoreEl = app.querySelector("#score");
  if (scoreEl) scoreEl.textContent = String(round.score);

  if (correct && round.streak >= 2) flashCombo(round.streak);
  if (!correct) {
    const qcard = app.querySelector("#qcard");
    qcard?.classList.add("shake");
    setTimeout(() => qcard?.classList.remove("shake"), 450);
  }

  // Feedback with an explanation and a citation.
  const fb = app.querySelector("#fb")!;
  const timedOut = selectedIndex === -1;
  const verdict = correct ? "✅ Correct!" : timedOut ? "⏰ Time's up" : "❌ Not quite";
  fb.innerHTML = `
    <div class="feedback ${correct ? "good" : "bad"}">
      ${gained > 0 ? `<span class="points">+${gained}</span>` : ""}
      <div class="verdict">${verdict}</div>
      <div class="explanation">${escapeHtml(q.explanation)}</div>
      <div class="citation">📖 ${escapeHtml(q.citation)}</div>
    </div>
  `;

  // Announce the result, score and explanation to assistive tech.
  const verdictText = correct ? "Correct" : timedOut ? "Time's up" : "Not quite";
  announce(`${verdictText}. ${correct ? `Plus ${gained} points. ` : ""}${q.explanation} Source: ${q.citation}`);

  const cont = app.querySelector("#cont")!;
  cont.innerHTML = `<div style="height:14px"></div><button class="btn" id="next">${
    round.index + 1 >= round.queue.length ? "Round results →" : "Next →"
  }</button>`;
  const nextBtn = cont.querySelector("#next") as HTMLButtonElement;
  nextBtn.addEventListener("click", () => {
    round!.index += 1;
    renderQuestion();
  });
  nextBtn.focus();
}

function renderResults(): void {
  if (!round) return renderMenu();
  stopTimer();
  const stats: RoundStats = {
    total: round.answered,
    correct: round.correct,
    bestStreak: round.bestStreak,
    score: round.score,
  };
  const acc = accuracyPercent(stats);
  const lvl = levelForXp(progress.xp);
  const next = nextLevel(progress.xp);
  const progPct = Math.round(levelProgress(progress.xp) * 100);

  const grade =
    acc >= 90
      ? "Brilliant! 🏆"
      : acc >= 70
        ? "Great result! 👏"
        : acc >= 50
          ? "Not bad, keep going! 💪"
          : "Room to grow 📚";

  const wasReview = round.isReview;

  app.innerHTML = `
    <h1 class="title">Round results</h1>
    <p class="subtitle">${grade}</p>

    <div class="card">
      <div class="result-grid">
        <div class="result-cell"><div class="big">${stats.score}</div><div class="lbl">Score</div></div>
        <div class="result-cell"><div class="big">${acc}%</div><div class="lbl">Accuracy</div></div>
        <div class="result-cell"><div class="big">${stats.correct}/${stats.total}</div><div class="lbl">Correct</div></div>
        <div class="result-cell"><div class="big">🔥 ${stats.bestStreak}</div><div class="lbl">Best streak</div></div>
      </div>

      <div class="hud" style="margin-top:6px">
        <div class="stat"><span class="label">Rank</span><span class="value">${lvl.title}</span></div>
        <div class="stat"><span class="label">XP</span><span class="value">${progress.xp}</span></div>
        <div class="level-bar">
          <span class="label" style="font-size:.7rem;color:var(--muted)">${
            next ? `to "${next.title}"` : "maximum level"
          }</span>
          <div class="track"><div class="fill" style="width:${progPct}%"></div></div>
        </div>
      </div>
    </div>

    <div class="row">
      <button class="btn" id="again">↻ Play again</button>
      <button class="btn secondary" id="share">📋 Share</button>
    </div>
    <div style="height:10px"></div>
    <button class="btn ghost" id="menu">Back to menu</button>
  `;

  app.querySelector("#again")!.addEventListener("click", () => {
    const useTimer = round!.useTimer;
    if (wasReview) startReview(useTimer);
    else startRound(round!.selectedCats, useTimer);
  });
  app.querySelector("#menu")!.addEventListener("click", () => {
    round = null;
    renderMenu();
  });
  app.querySelector("#share")!.addEventListener("click", async () => {
    const text = buildShareText(stats, lvl.title);
    try {
      await navigator.clipboard.writeText(text);
      toast("Result copied to clipboard");
      announce("Result copied to clipboard");
    } catch {
      // No-network fallback: show the text for manual copying.
      prompt("Copy your result:", text);
    }
  });

  focusHeading();
  announce(
    `Round complete. Score ${stats.score}, accuracy ${acc} percent, ${stats.correct} of ${stats.total} correct.`,
  );
}

// ===================== UI utilities =====================

function flashCombo(streak: number): void {
  const el = document.createElement("div");
  el.className = "combo-flash";
  el.textContent = `COMBO ×${streak}!`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 950);
}

let toastTimer: number | null = null;
function toast(msg: string): void {
  let el = document.querySelector(".toast") as HTMLElement | null;
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  requestAnimationFrame(() => el!.classList.add("show"));
  if (toastTimer !== null) clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => el!.classList.remove("show"), 2200);
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ===================== Keyboard shortcuts =====================
// During a question: keys 1–4 select an option, Enter advances to the next
// question (or results) once the question has been answered.
document.addEventListener("keydown", (e) => {
  if (!round) return;
  if (e.target instanceof HTMLInputElement) return;

  if (e.key === "Enter") {
    const nextBtn = app.querySelector("#next") as HTMLButtonElement | null;
    if (nextBtn) {
      e.preventDefault();
      nextBtn.click();
    }
    return;
  }

  if (questionAnswered) return;
  const n = Number(e.key);
  if (Number.isInteger(n) && n >= 1 && n <= 4) {
    const options = Array.from(app.querySelectorAll(".option")) as HTMLButtonElement[];
    const btn = options[n - 1];
    if (btn && !btn.disabled) {
      e.preventDefault();
      btn.click();
    }
  }
});

// ===================== Start =====================
renderMenu();
