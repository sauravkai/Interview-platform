export const DASHBOARD_CATEGORY_COLORS = {
  Arrays: '#6366f1',
  Strings: '#8b5cf6',
  Trees: '#ec4899',
  Graphs: '#14b8a6',
  DP: '#f59e0b',
  Other: '#64748b',
};

export const DASHBOARD_CATEGORY_ORDER = ['Arrays', 'Strings', 'Trees', 'Graphs', 'DP', 'Other'];

export const EMPTY_STREAK = {
  currentStreak: 0,
  weeklyProgress: [false, false, false, false, false, false, false],
  lastActiveDate: '',
};

export function getLocalDateKey(date = new Date()) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function normalizeLearningStreak(rawStreak = null) {
  const parsed = rawStreak && typeof rawStreak === 'object' ? rawStreak : EMPTY_STREAK;
  const weeklyProgress = Array.isArray(parsed.weeklyProgress) && parsed.weeklyProgress.length === 7
    ? parsed.weeklyProgress.map(Boolean)
    : EMPTY_STREAK.weeklyProgress.slice();

  const lastActiveDate = parsed.lastActiveDate || '';
  const currentStreak = Number.isFinite(Number(parsed.currentStreak)) ? Number(parsed.currentStreak) : 0;
  const normalized = {
    currentStreak: Math.max(0, currentStreak),
    weeklyProgress,
    lastActiveDate,
  };

  if (lastActiveDate) {
    const lastDate = new Date(lastActiveDate);
    if (!Number.isNaN(lastDate.getTime()) && getLocalDateKey(lastDate) === getLocalDateKey(new Date())) {
      normalized.currentStreak = Math.max(1, normalized.currentStreak);
      normalized.weeklyProgress[(new Date().getDay() + 6) % 7] = true;
    }
  }

  return normalized;
}

export function resolveLearningStreak(rawStreak = null, now = new Date()) {
  const streak = normalizeLearningStreak(rawStreak);
  const todayKey = getLocalDateKey(now);
  const lastDate = streak.lastActiveDate ? new Date(streak.lastActiveDate) : null;

  if (!streak.lastActiveDate || Number.isNaN(lastDate?.getTime())) {
    return {
      currentStreak: 1,
      weeklyProgress: EMPTY_STREAK.weeklyProgress.slice(),
      lastActiveDate: todayKey,
    };
  }

  const lastKey = getLocalDateKey(lastDate);
  const diffDays = Math.round((new Date(todayKey) - new Date(lastKey)) / (1000 * 60 * 60 * 24));

  const nextWeeklyProgress = streak.weeklyProgress.slice();
  const dayIndex = (now.getDay() + 6) % 7;
  nextWeeklyProgress[dayIndex] = true;

  if (diffDays === 0) {
    return {
      currentStreak: Math.max(1, streak.currentStreak || 1),
      weeklyProgress: nextWeeklyProgress,
      lastActiveDate: lastKey,
    };
  }

  if (diffDays === 1) {
    return {
      currentStreak: Math.max(1, (streak.currentStreak || 0) + 1),
      weeklyProgress: nextWeeklyProgress,
      lastActiveDate: todayKey,
    };
  }

  return {
    currentStreak: 1,
    weeklyProgress: nextWeeklyProgress,
    lastActiveDate: todayKey,
  };
}

export function getCanonicalSolvedCount({ user, solvedHistory = [], localSolvedProgress = 0 }) {
  const statCount = Number(user?.stats?.problemsSolved ?? 0);
  const historyCount = Array.isArray(solvedHistory)
    ? solvedHistory.filter((entry) => entry?.problemTitle).length
    : 0;
  const localCount = Number(localSolvedProgress || 0);

  if (Array.isArray(solvedHistory) && solvedHistory.length > 0) {
    return Math.max(historyCount, localCount, statCount, 0);
  }

  return Math.max(statCount, localCount, 0);
}

export function buildCategoryDistribution({ solvedCount = 0, solvedHistory = [], problems = [] }) {
  const categoryCounts = Object.fromEntries(DASHBOARD_CATEGORY_ORDER.map((category) => [category, 0]));

  const categoryByTitle = new Map();
  for (const problem of Array.isArray(problems) ? problems : []) {
    if (problem?.title && problem?.category) {
      categoryByTitle.set(problem.title, problem.category);
    }
  }

  for (const entry of Array.isArray(solvedHistory) ? solvedHistory : []) {
    const title = entry?.problemTitle;
    if (!title) continue;

    const category = categoryByTitle.get(title) || DASHBOARD_CATEGORY_ORDER[(title.length + (entry?.date ? entry.date.length : 0)) % DASHBOARD_CATEGORY_ORDER.length];
    if (categoryCounts[category] !== undefined) {
      categoryCounts[category] += 1;
    } else {
      categoryCounts.Other += 1;
    }
  }

  const totalSolvedCategories = Object.values(categoryCounts).reduce((sum, value) => sum + value, 0);

  if (totalSolvedCategories === 0 && solvedCount > 0) {
    const weights = [35, 20, 15, 12, 10, 8];
    let remaining = solvedCount;

    for (let i = 0; i < DASHBOARD_CATEGORY_ORDER.length; i += 1) {
      const category = DASHBOARD_CATEGORY_ORDER[i];
      const share = i === DASHBOARD_CATEGORY_ORDER.length - 1
        ? remaining
        : Math.max(0, Math.round((solvedCount * weights[i]) / 100));
      categoryCounts[category] = Math.min(share, remaining);
      remaining -= categoryCounts[category];
    }

    if (remaining > 0) {
      categoryCounts.Other += remaining;
    }
  }

  return DASHBOARD_CATEGORY_ORDER.map((name) => ({
    name,
    value: categoryCounts[name] || 0,
    color: DASHBOARD_CATEGORY_COLORS[name] || DASHBOARD_CATEGORY_COLORS.Other,
  }));
}
