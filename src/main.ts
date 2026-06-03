import "./styles/main.css";
import { QUESTIONS } from "./data/questions";
import {
  CATEGORIES,
  QUESTION_TYPES,
  type Category,
  type Question,
} from "./data/types";
import { isCorrect, filterByCategories, seededShuffle } from "./lib/answer";
import { scoreAnswer, comboMultiplier, accuracyPercent, type RoundStats } from "./lib/scoring";
import { levelForXp, nextLevel, levelProgress } from "./lib/levels";
import { newCard, reviewCard, tickQueue, pickNext, masteredCount, type CardState } from "./lib/srs";
import { loadProgress, saveProgress, resetProgress, type Progress } from "./lib/storage";
import { buildShareText } from "./lib/share";

const QUESTIONS_PER_ROUND = 10;
const TIMER_MS = 25_000;

const app = document.getElementById("app")!;
let progress: Progress = loadProgress();

// ------- Состояние раунда -------
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
}

let round: RoundState | null = null;
let timerHandle: number | null = null;
let timerStart = 0;

// ===================== Экраны =====================

function renderMenu(selected: Set<Category> = new Set()): void {
  stopTimer();
  const lvl = levelForXp(progress.xp);
  const next = nextLevel(progress.xp);
  const progPct = Math.round(levelProgress(progress.xp) * 100);
  const acc = accuracyPercent({ total: progress.totalAnswered, correct: progress.totalCorrect });
  const mastered = masteredCount(progress.cards);

  app.innerHTML = `
    <h1 class="title">📜 Познаём закон</h1>
    <p class="subtitle">Игра-викторина по основам российского права. Угадывай кодекс, статью, отличай мифы от норм.</p>

    <div class="disclaimer">
      ⚠️ Это образовательная игра, а <b>не юридическая консультация</b>. Нормы права меняются —
      сверяйтесь с актуальной редакцией на
      <a href="http://pravo.gov.ru" target="_blank" rel="noopener">pravo.gov.ru</a>
      или в КонсультантПлюс. После каждого ответа показывается ссылка на норму для самопроверки.
    </div>

    <div class="card">
      <div class="hud">
        <div class="stat"><span class="label">Звание</span><span class="value">${lvl.title}</span></div>
        <div class="stat"><span class="label">XP</span><span class="value">${progress.xp}</span></div>
        <div class="level-bar">
          <span class="label" style="font-size:.7rem;color:var(--muted)">${
            next ? `до «${next.title}»` : "максимальный уровень"
          }</span>
          <div class="track"><div class="fill" style="width:${progPct}%"></div></div>
        </div>
      </div>
      <div class="hud">
        <div class="stat"><span class="label">Точность</span><span class="value">${acc}%</span></div>
        <div class="stat"><span class="label">Ответов</span><span class="value">${progress.totalAnswered}</span></div>
        <div class="stat"><span class="label">Освоено</span><span class="value">${mastered}/${QUESTIONS.length}</span></div>
      </div>
    </div>

    <div class="card">
      <h3>Выбери отрасли права</h3>
      <div class="chips" id="cats"></div>
      <p class="chip-hint">Ничего не выбрано — играем по всем отраслям.</p>
      <label class="chip-hint" style="display:flex;gap:8px;align-items:center;margin-top:12px;cursor:pointer">
        <input type="checkbox" id="timer" checked /> Включить таймер (бонус за скорость)
      </label>
      <div style="height:14px"></div>
      <button class="btn" id="start">▶ Играть (${QUESTIONS_PER_ROUND} вопросов)</button>
      <div style="height:10px"></div>
      <button class="btn ghost" id="reset">Сбросить прогресс</button>
    </div>

    <footer>
      Открытый код · MIT · хостинг GitHub Pages · работает офлайн, без сбора данных.<br />
      Прогресс хранится только в этом браузере (localStorage).
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

  app.querySelector("#start")!.addEventListener("click", () => {
    const useTimer = (app.querySelector("#timer") as HTMLInputElement).checked;
    startRound(selected, useTimer);
  });

  app.querySelector("#reset")!.addEventListener("click", () => {
    if (confirm("Сбросить весь прогресс, XP и освоенные вопросы?")) {
      resetProgress();
      progress = loadProgress();
      renderMenu();
      toast("Прогресс сброшен");
    }
  });
}

function startRound(selectedCats: Set<Category>, useTimer: boolean): void {
  const pool = filterByCategories(QUESTIONS, selectedCats);
  // Стартовая очередь: приоритет вопросам из SRS, затем добор по seeded shuffle.
  const poolIds = pool.map((q) => q.id);
  const byId = new Map(pool.map((q) => [q.id, q]));
  const ordered: Question[] = [];
  const used = new Set<string>();
  const seed = Date.now() & 0xffffffff;
  const shuffled = seededShuffle(poolIds, seed);
  const cardsCopy = { ...progress.cards };

  // Сначала — просроченные ошибки/новые через pickNext, затем остаток.
  for (let i = 0; i < QUESTIONS_PER_ROUND && ordered.length < pool.length; i++) {
    const next = pickNext(
      shuffled.filter((id) => !used.has(id)),
      cardsCopy,
    );
    if (!next) break;
    used.add(next);
    ordered.push(byId.get(next)!);
  }
  // Если вопросов меньше QUESTIONS_PER_ROUND — играем сколько есть.

  round = {
    queue: ordered,
    index: 0,
    selectedCats,
    useTimer,
    streak: 0,
    bestStreak: 0,
    correct: 0,
    answered: 0,
    score: 0,
    answeredIds: new Set(),
  };
  renderQuestion();
}

function renderQuestion(): void {
  if (!round) return renderMenu();
  if (round.index >= round.queue.length) return renderResults();

  stopTimer();
  const q = round.queue[round.index];

  app.innerHTML = `
    <div class="hud">
      <div class="stat"><span class="label">Счёт</span><span class="value" id="score">${round.score}</span></div>
      <div class="stat"><span class="label">Серия</span><span class="value">${
        round.streak > 0 ? `🔥 ${round.streak}` : "—"
      }</span></div>
      <div class="stat" style="margin-left:auto;text-align:right">
        <span class="label">Множитель</span><span class="value">×${comboMultiplier(round.streak + 1)}</span>
      </div>
    </div>

    <div class="card" id="qcard">
      <div class="q-meta">
        <span class="tag">${CATEGORIES[q.category].emoji} ${CATEGORIES[q.category].title}</span>
        <span class="tag">${QUESTION_TYPES[q.type].title}</span>
        <span class="q-progress">${round.index + 1} / ${round.queue.length}</span>
        ${round.useTimer ? `<span class="timer" id="timer">${(TIMER_MS / 1000) | 0}с</span>` : ""}
      </div>
      <div class="prompt">${escapeHtml(q.prompt)}</div>
      <div class="options" id="options"></div>
      <div id="fb"></div>
      <div id="cont"></div>
    </div>
    <button class="btn ghost" id="quit">Закончить раунд</button>
  `;

  const optionsEl = app.querySelector("#options")!;
  q.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.className = "option";
    btn.innerHTML = `<span class="key">${String.fromCharCode(65 + i)}</span><span>${escapeHtml(opt)}</span>`;
    btn.addEventListener("click", () => answer(q, i));
    optionsEl.appendChild(btn);
  });

  app.querySelector("#quit")!.addEventListener("click", () => renderResults());

  if (round.useTimer) startTimer(q);
}

function startTimer(q: Question): void {
  timerStart = Date.now();
  const el = app.querySelector("#timer") as HTMLElement | null;
  timerHandle = window.setInterval(() => {
    const remaining = TIMER_MS - (Date.now() - timerStart);
    if (el) {
      const sec = Math.max(0, Math.ceil(remaining / 1000));
      el.textContent = `${sec}с`;
      el.classList.toggle("low", sec <= 5);
    }
    if (remaining <= 0) {
      stopTimer();
      // Время вышло — засчитываем как неверный ответ (индекс вне диапазона).
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
  stopTimer();
  const correct = selectedIndex >= 0 && isCorrect(q, selectedIndex);
  const remainingMs = round.useTimer ? Math.max(0, TIMER_MS - (Date.now() - timerStart)) : 0;

  // Обновляем серию и очки.
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

  // Обновляем SRS-карточку и глобальный прогресс.
  const card: CardState = progress.cards[q.id] ?? newCard(q.id);
  progress.cards[q.id] = reviewCard(card, correct);
  progress.cards = Object.fromEntries(tickQueue(Object.values(progress.cards)).map((c) => [c.id, c]));
  progress.xp += gained;
  progress.totalAnswered += 1;
  if (correct) progress.totalCorrect += 1;
  progress.bestStreak = Math.max(progress.bestStreak, round.bestStreak);
  saveProgress(progress);

  // Подсветка вариантов.
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

  // Фидбэк с объяснением и ссылкой.
  const fb = app.querySelector("#fb")!;
  const timedOut = selectedIndex === -1;
  fb.innerHTML = `
    <div class="feedback ${correct ? "good" : "bad"}">
      ${gained > 0 ? `<span class="points">+${gained}</span>` : ""}
      <div class="verdict">${
        correct ? "✅ Верно!" : timedOut ? "⏰ Время вышло" : "❌ Не угадал"
      }</div>
      <div class="explanation">${escapeHtml(q.explanation)}</div>
      <div class="citation">📖 ${escapeHtml(q.citation)}</div>
    </div>
  `;

  const cont = app.querySelector("#cont")!;
  cont.innerHTML = `<div style="height:14px"></div><button class="btn" id="next">${
    round.index + 1 >= round.queue.length ? "Итоги раунда →" : "Дальше →"
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
    acc >= 90 ? "Блестяще! 🏆" : acc >= 70 ? "Отличный результат! 👏" : acc >= 50 ? "Неплохо, продолжай! 💪" : "Есть куда расти 📚";

  app.innerHTML = `
    <h1 class="title">Итоги раунда</h1>
    <p class="subtitle">${grade}</p>

    <div class="card">
      <div class="result-grid">
        <div class="result-cell"><div class="big">${stats.score}</div><div class="lbl">Очки</div></div>
        <div class="result-cell"><div class="big">${acc}%</div><div class="lbl">Точность</div></div>
        <div class="result-cell"><div class="big">${stats.correct}/${stats.total}</div><div class="lbl">Правильно</div></div>
        <div class="result-cell"><div class="big">🔥 ${stats.bestStreak}</div><div class="lbl">Лучшая серия</div></div>
      </div>

      <div class="hud" style="margin-top:6px">
        <div class="stat"><span class="label">Звание</span><span class="value">${lvl.title}</span></div>
        <div class="stat"><span class="label">XP</span><span class="value">${progress.xp}</span></div>
        <div class="level-bar">
          <span class="label" style="font-size:.7rem;color:var(--muted)">${
            next ? `до «${next.title}»` : "максимальный уровень"
          }</span>
          <div class="track"><div class="fill" style="width:${progPct}%"></div></div>
        </div>
      </div>
    </div>

    <div class="row">
      <button class="btn" id="again">↻ Ещё раунд</button>
      <button class="btn secondary" id="share">📋 Поделиться</button>
    </div>
    <div style="height:10px"></div>
    <button class="btn ghost" id="menu">В меню</button>
  `;

  app.querySelector("#again")!.addEventListener("click", () =>
    startRound(round!.selectedCats, round!.useTimer),
  );
  app.querySelector("#menu")!.addEventListener("click", () => {
    round = null;
    renderMenu();
  });
  app.querySelector("#share")!.addEventListener("click", async () => {
    const text = buildShareText(stats, lvl.title);
    try {
      await navigator.clipboard.writeText(text);
      toast("Результат скопирован в буфер обмена");
    } catch {
      // Фолбэк без сети: показываем текст для ручного копирования.
      prompt("Скопируйте результат:", text);
    }
  });
}

// ===================== Утилиты UI =====================

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
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ===================== Старт =====================
renderMenu();
