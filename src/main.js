import { createClient } from '@supabase/supabase-js';
import './styles.css';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://proydwxsyvlvzyujzgbo.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByb3lkd3hzeXZsdnp5dWp6Z2JvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzYxNDUsImV4cCI6MjA5MTE1MjE0NX0.pxRuBIyK2CpVVAzT60eCQ_fKxjZepGpX8rd01eE3mc4';
const AI_PROXY_FUNCTION = import.meta.env.VITE_AI_PROXY_FUNCTION || 'ai-proxy';
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    // Отключаем автоматический refresh: он уходил в бесконечный цикл при гонке.
    // Если токен протух — пользователь просто перелогинится.
    autoRefreshToken: false,
    detectSessionInUrl: true,
    // Отключаем Web Locks API: вызывает "lock was released because another request stole it".
    lock: async (_name, _acquireTimeout, fn) => fn(),
  },
});
const STORAGE_KEY = 'careerpath_state_v2';
const BADGES_KEY = 'careerpath_badges_v2';

let currentUser = null;
let earnedBadges = new Set();
let saveTimer = null;
let tmFilterValue = 'all';

const initialState = {
  schemaVersion: 2,
  xp: 0,
  level: 1,
  streak: 0,
  lastActivityDate: null,
  profile: {
    name: '',
    currentRole: '',
    targetRole: '',
    project: '',
    market: '',
    preferredLanguage: 'ru',
    experienceSummary: ''
  },
  plan: [],
  achievements: [],
  answers: {},
  gapResults: null,
  taskMap: [],
  interviewQuestions: [],
  tmDone: {},
  tmNotes: {},
  tmMetrics: {}
};

let S = structuredClone(initialState);

const LEVELS = [
  {name:'Starter',xp:0},{name:'Explorer',xp:100},{name:'Builder',xp:300},
  {name:'Practitioner',xp:600},{name:'Specialist',xp:1000},{name:'Expert',xp:1500},
  {name:'Lead',xp:2200},{name:'Senior',xp:3000},{name:'Principal',xp:4000},{name:'Director',xp:5500}
];

const BADGES_DEF = [
  {id:'first_analysis',icon:'🤖',name:'Первый анализ',desc:'Запустил AI-анализ'},
  {id:'first_plan',icon:'📋',name:'Планировщик',desc:'Добавил первый навык в план'},
  {id:'first_done',icon:'✅',name:'Выполнено!',desc:'Закрыл первый навык'},
  {id:'first_ach',icon:'🏆',name:'Достижение',desc:'Добавил первое достижение'},
  {id:'three_done',icon:'🔥',name:'На ходу',desc:'Закрыл 3 навыка'},
  {id:'five_done',icon:'⚡',name:'Momentum',desc:'Закрыл 5 навыков'},
  {id:'interview_prep',icon:'🎯',name:'Готов к бою',desc:'Ответил на 3 вопроса'},
];

const SAFE_URL_PREFIXES = ['https://', 'http://'];

function esc(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function safeUrl(url) {
  const u = String(url || '').trim();
  if (!SAFE_URL_PREFIXES.some(prefix => u.startsWith(prefix))) return '#';
  return u.replace(/"/g, '%22');
}

function uid(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function migrateState(raw) {
  const next = {...structuredClone(initialState), ...(raw || {})};
  next.schemaVersion = 2;
  next.profile = {...initialState.profile, ...(raw?.profile || {})};
  next.plan = Array.isArray(raw?.plan) ? raw.plan : [];
  next.achievements = Array.isArray(raw?.achievements) ? raw.achievements : [];
  next.answers = raw?.answers && typeof raw.answers === 'object' ? raw.answers : {};
  next.taskMap = Array.isArray(raw?.taskMap) ? raw.taskMap : [];
  next.interviewQuestions = Array.isArray(raw?.interviewQuestions) ? raw.interviewQuestions : [];
  next.tmDone = raw?.tmDone && typeof raw.tmDone === 'object' ? raw.tmDone : {};
  next.tmNotes = raw?.tmNotes && typeof raw.tmNotes === 'object' ? raw.tmNotes : {};
  next.tmMetrics = raw?.tmMetrics && typeof raw.tmMetrics === 'object' ? raw.tmMetrics : {};
  return next;
}

function hasProfile() {
  return Boolean(S.profile.name && S.profile.currentRole && S.profile.targetRole);
}

function displayName() {
  return S.profile.name || currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'пользователь';
}

function projectName() {
  return S.profile.project || 'твой проект';
}

function getAccessTokenSync() {
  // Supabase хранит сессию в localStorage под ключом sb-{project-ref}-auth-token.
  // Берём её напрямую, чтобы не дёргать sb.auth.getSession() — он может уходить в зависание.
  try {
    const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0];
    const key = `sb-${projectRef}-auth-token`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.access_token || parsed?.currentSession?.access_token || null;
  } catch {
    return null;
  }
}

async function callAI(task, input) {
  console.log('[callAI] start', task);

  // Берём токен из localStorage напрямую — sb.auth.getSession() зависает
  let token = getAccessTokenSync();

  // Если токена нет — пробуем через sb.auth как запасной вариант (с таймаутом)
  if (!token) {
    console.log('[callAI] no token in localStorage, trying sb.auth...');
    try {
      const result = await Promise.race([
        sb.auth.getSession(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Auth timeout')), 5000))
      ]);
      token = result?.data?.session?.access_token;
    } catch (e) {
      console.warn('[callAI] sb.auth failed:', e.message);
    }
  }

  // Если всё равно нет токена — используем anon key (для публичных функций)
  if (!token) {
    console.warn('[callAI] no session token, using anon key');
    token = SUPABASE_ANON_KEY;
  }

  console.log('[callAI] token ok, invoking edge function...');

  const url = `${SUPABASE_URL}/functions/v1/${AI_PROXY_FUNCTION}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ task, input }),
  });

  console.log('[callAI] response status', res.status);

  let data;
  try {
    data = await res.json();
  } catch (error) {
    console.error('[callAI] non-json response', error);
    throw new Error(`Сервер вернул не-JSON ответ. Статус: ${res.status}`);
  }

  console.log('[callAI] response data:', JSON.stringify(data).slice(0, 500));

  if (!res.ok) throw new Error(data?.error || `Edge Function вернула ошибку ${res.status}`);
  if (data?.error) throw new Error(data.error);

  console.log('[callAI] success');
  return data;
}


function localLoad() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    S = migrateState(raw);
    const badges = JSON.parse(localStorage.getItem(BADGES_KEY) || '[]');
    earnedBadges = new Set(Array.isArray(badges) ? badges : []);
  } catch {
    S = structuredClone(initialState);
    earnedBadges = new Set();
  }
}

function localSave() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(S));
  localStorage.setItem(BADGES_KEY, JSON.stringify([...earnedBadges]));
}

async function loadFromCloud() {
  if (!currentUser) return;
  const { data, error } = await sb.from('user_data').select('state').eq('id', currentUser.id).maybeSingle();
  if (!error && data?.state) {
    S = migrateState(data.state);
    if (Array.isArray(data.state.badges)) earnedBadges = new Set(data.state.badges);
  }
}

async function saveToCloud() {
  if (!currentUser) return;
  setSyncStatus('ing');
  const payload = {
    id: currentUser.id,
    state: {...S, badges: [...earnedBadges]},
    updated_at: new Date().toISOString()
  };
  const { error } = await sb.from('user_data').upsert(payload);
  setSyncStatus(error ? 'err' : 'ok');
}

function save() {
  localSave();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveToCloud, 900);
}

function setSyncStatus(status) {
  const el = document.getElementById('sync-status');
  if (!el) return;
  el.className = `sync-status sync-${status}`;
  el.textContent = status === 'ok' ? '☁️ сохранено' : status === 'ing' ? '⏳ сохраняю...' : '⚠️ ошибка';
}

function showNotif(message) {
  const el = document.getElementById('notif');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2800);
}

function touchActivity() {
  const today = new Date().toISOString().slice(0, 10);
  if (S.lastActivityDate === today) return;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  S.streak = S.lastActivityDate === yesterday ? (S.streak || 0) + 1 : 1;
  S.lastActivityDate = today;
}

function addXP(amount, label) {
  S.xp = Math.max(0, (S.xp || 0) + amount);
  touchActivity();
  updateXPUI();
  showNotif(`+${amount} XP — ${label}`);
  checkBadges();
  save();
}

function updateXPUI() {
  let lv = 0;
  for (let i = 0; i < LEVELS.length; i++) if (S.xp >= LEVELS[i].xp) lv = i;
  S.level = lv + 1;
  const cur = LEVELS[lv].xp;
  const next = LEVELS[lv + 1] ? LEVELS[lv + 1].xp : LEVELS[lv].xp + 1000;
  const pct = Math.min(100, Math.round(((S.xp - cur) / Math.max(1, next - cur)) * 100));
  setText('xp-cur', S.xp);
  setText('xp-to-next', next - S.xp);
  setText('xp-next-level', lv + 2);
  setText('xp-level-label', `Уровень ${S.level} — ${LEVELS[lv].name}`);
  setText('tb-xp', S.xp);
  setText('s-xp', S.xp);
  setText('streak-num', S.streak || 0);
  const bar = document.getElementById('xp-bar');
  if (bar) bar.style.width = `${pct}%`;
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function checkBadges() {
  const done = S.plan.filter(p => p.done).length + Object.values(S.tmDone || {}).filter(Boolean).length;
  const ansCount = Object.values(S.answers || {}).filter(v => v && String(v).trim()).length;
  if (S.gapResults) tryBadge('first_analysis');
  if (S.plan.length > 0) tryBadge('first_plan');
  if (done >= 1) tryBadge('first_done');
  if (S.achievements.length > 0) tryBadge('first_ach');
  if (done >= 3) tryBadge('three_done');
  if (done >= 5) tryBadge('five_done');
  if (ansCount >= 3) tryBadge('interview_prep');
  renderBadges();
}

function tryBadge(id) {
  if (earnedBadges.has(id)) return;
  earnedBadges.add(id);
  const b = BADGES_DEF.find(item => item.id === id);
  if (b) showNotif(`🏅 Бейдж: ${b.name}`);
}

function renderBadges() {
  const grid = document.getElementById('badges-grid');
  if (!grid) return;
  grid.innerHTML = BADGES_DEF.map(b => `<div class="badge ${earnedBadges.has(b.id) ? 'earned' : 'locked'}" title="${esc(b.name)}: ${esc(b.desc)}">${esc(b.icon)}</div>`).join('');
}

function renderShell() {
  document.getElementById('root').innerHTML = `
    <div class="auth-screen" id="auth-screen">
      <div class="auth-box">
        <div class="auth-logo">CareerPath AI</div>
        <div class="auth-tagline">Карьерный трекер с AI-анализом гэпов</div>
        <div class="auth-tabs">
          <div class="auth-tab active" data-auth-tab="login">Войти</div>
          <div class="auth-tab" data-auth-tab="register">Регистрация</div>
        </div>
        <div id="auth-form-login">
          <div class="auth-field"><label class="auth-label">Email</label><input type="email" class="auth-input" id="login-email" placeholder="your@email.com"></div>
          <div class="auth-field"><label class="auth-label">Пароль</label><input type="password" class="auth-input" id="login-password" placeholder="••••••••"></div>
          <button class="auth-btn" id="login-btn" data-action="login">Войти</button>
          <button class="small-link" style="margin-top:12px;width:100%" data-action="reset-password">Не помню пароль</button>
          <div class="auth-error" id="login-error"></div>
        </div>
        <div id="auth-form-register" style="display:none">
          <div class="auth-field"><label class="auth-label">Email</label><input type="email" class="auth-input" id="reg-email" placeholder="your@email.com"></div>
          <div class="auth-field"><label class="auth-label">Пароль (минимум 6 символов)</label><input type="password" class="auth-input" id="reg-password" placeholder="••••••••"></div>
          <button class="auth-btn" id="reg-btn" data-action="register">Создать аккаунт</button>
          <div class="auth-error" id="reg-error"></div><div class="auth-success" id="reg-success"></div>
        </div>
        <div class="auth-divider"><span>или</span></div>
        <button class="auth-google" data-action="google-auth">Войти через Google</button>
      </div>
    </div>

    <div class="onboarding-screen" id="onboarding-screen">
      <div class="onboarding-box">
        <div class="card-title">Настрой профиль</div>
        <div class="card-sub">Эти данные заменяют хардкод и используются в анализе, карте заданий, интервью и резюме.</div>
        <div class="onboarding-grid">
          ${field('profile-name','Имя','Иван / Мария / Алексей')}
          ${field('profile-current-role','Текущая роль','Маркетолог, дизайнер, продакт, студент')}
          ${field('profile-target-role','Целевая роль','Product Marketing Manager / AI Automation Specialist')}
          ${field('profile-project','Проект / компания','Название проекта или «личный бренд»')}
          ${field('profile-market','Рынок / ниша','B2B SaaS, логистика, e-commerce, медиа')}
          <div class="field-group full"><div class="field-label">Коротко об опыте</div><textarea class="answer-area" id="profile-experience" placeholder="3–5 строк: чем занимался, какие инструменты знаешь, какие результаты были"></textarea></div>
        </div>
        <div style="display:flex;gap:8px;margin-top:18px;justify-content:flex-end;flex-wrap:wrap">
          <button class="btn btn-ghost" data-action="close-onboarding">Позже</button>
          <button class="btn btn-green" data-action="save-profile">Сохранить профиль</button>
        </div>
      </div>
    </div>

    <div class="app" id="main-app" style="display:none">
      <nav class="sidebar">
        <div class="sb-brand"><div class="sb-logo">CareerPath AI</div><div class="sb-tagline">Персональный карьерный путь</div></div>
        <div class="sb-xp"><div class="xp-label"><span>XP: <span id="xp-cur">0</span></span><span>до ур. <span id="xp-next-level">2</span>: <span id="xp-to-next">100</span> XP</span></div><div class="xp-bar"><div class="xp-fill" id="xp-bar"></div></div><div class="xp-level" id="xp-level-label">Уровень 1 — Starter</div></div>
        <div class="sb-nav">
          <div class="sb-section">Главное</div>
          ${navItem('home','🏠','Дашборд', true)}
          ${navItem('analyzer','🤖','AI Анализ гэпов')}
          <div class="sb-section">Развитие</div>
          ${navItem('plan','📋','Мой план')}
          ${navItem('taskmap','🗺️','Карта заданий')}
          ${navItem('achievements','🏆','Достижения')}
          ${navItem('interview','🎯','Подготовка к интервью')}
          <div class="sb-section">Профиль</div>
          ${navItem('resume','📄','Резюме-конструктор')}
        </div>
        <div class="sb-badges"><div class="badges-label">Бейджи</div><div class="badges-grid" id="badges-grid"></div></div>
        <div class="user-bar"><div class="user-avatar" id="user-avatar">?</div><div class="user-email" id="user-email">загрузка...</div><span class="sync-status sync-ok" id="sync-status">☁️ синк</span><button class="user-logout" data-action="logout" title="Выйти">⏻</button></div>
      </nav>
      <div class="main"><div class="topbar"><div class="tb-title" id="tb-title">Дашборд</div><div class="tb-right"><button class="btn btn-ghost" style="font-size:9px;padding:6px 10px" data-action="open-profile">Профиль</button><div class="tb-streak">🔥 <span id="streak-num">0</span> дней</div><div class="tb-points">⚡ <span id="tb-xp">0</span> XP</div></div></div><div style="flex:1;overflow-y:auto" id="views"></div></div>
    </div>
    <div class="notif" id="notif"></div>`;
}

function field(id, label, placeholder) {
  return `<div class="field-group"><div class="field-label">${esc(label)}</div><input class="field-input" id="${id}" placeholder="${esc(placeholder)}"></div>`;
}

function navItem(id, icon, label, active=false) {
  return `<div class="sb-item ${active ? 'active' : ''}" data-nav="${id}"><span class="si-icon">${icon}</span> ${esc(label)}</div>`;
}

function renderViews() {
  document.getElementById('views').innerHTML = `
    <div class="view active" id="view-home"></div>
    <div class="view" id="view-analyzer"></div>
    <div class="view" id="view-plan"></div>
    <div class="view" id="view-taskmap"></div>
    <div class="view" id="view-achievements"></div>
    <div class="view" id="view-interview"></div>
    <div class="view" id="view-resume"></div>`;
  renderHome(); renderAnalyzer(); renderPlan(); renderTaskMap(); renderAchievements(); renderInterview(); renderResume();
}

function renderHome() {
  const el = document.getElementById('view-home');
  if (!el) return;
  const doneSkills = S.plan.filter(p => p.done).length;
  const doneTasks = Object.values(S.tmDone || {}).filter(Boolean).length;
  el.innerHTML = `
    <div class="stats-grid">
      <div class="stat"><div class="stat-n" id="s-skills" style="color:var(--green)">${doneSkills}</div><div class="stat-l">Навыков закрыто</div></div>
      <div class="stat"><div class="stat-n" id="s-plan" style="color:var(--blue)">${S.plan.length}</div><div class="stat-l">В плане</div></div>
      <div class="stat"><div class="stat-n" id="s-achieve" style="color:var(--orange)">${S.achievements.length}</div><div class="stat-l">Достижений</div></div>
      <div class="stat"><div class="stat-n" id="s-xp" style="color:var(--purple)">${S.xp}</div><div class="stat-l">Всего XP</div></div>
    </div>
    <div class="card">
      <div class="card-title">👋 Привет, ${esc(displayName())}</div>
      <div class="card-sub">Цель: <strong style="color:var(--green)">${esc(S.profile.targetRole || 'задать целевую роль')}</strong>. Проект: ${esc(projectName())}. Начни с AI-анализа: вставь резюме и вакансию, а система соберёт гэпы, план, карту заданий и вопросы для интервью.</div>
      <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-green" data-nav="analyzer">🤖 Начать анализ</button><button class="btn btn-ghost" data-action="open-profile">Изменить профиль</button></div>
    </div>
    ${hasProfile() ? `<div class="card"><div class="card-title">Профиль</div><div class="card-sub">
      <span class="profile-chip">Роль: ${esc(S.profile.currentRole)}</span>
      <span class="profile-chip">Цель: ${esc(S.profile.targetRole)}</span>
      <span class="profile-chip">Рынок: ${esc(S.profile.market || 'не указан')}</span>
    </div></div>` : `<div class="card"><div class="card-title">⚠️ Профиль не заполнен</div><div class="card-sub">Без профиля AI будет хуже персонализировать задания и интервью.</div><button class="btn btn-green" style="margin-top:12px" data-action="open-profile">Заполнить профиль</button></div>`}
    <div class="card"><div class="card-title">Прогресс задач</div><div class="card-sub">Выполнено заданий: <strong style="color:var(--green)">${doneTasks}</strong> / ${countTasks(S.taskMap)}</div></div>
    ${S.achievements.length ? `<div class="card"><div class="card-title">Последние достижения</div>${S.achievements.slice(-3).reverse().map(a=>`<div class="generated-line">${esc(a.line)}</div>`).join('')}</div>` : ''}`;
}

function renderAnalyzer() {
  const el = document.getElementById('view-analyzer');
  if (!el) return;
  el.innerHTML = `
    <div class="card"><div class="card-title">🤖 AI Анализ навыковых гэпов</div><div class="card-sub">Резюме опционально, вакансия обязательна. После анализа AI обновит план, карту заданий и интервью под твою роль.</div></div>
    <div class="analyzer-grid">
      <div class="input-block"><div class="input-label"><span>📄</span> Твоё резюме / навыки</div><textarea id="resume-input" placeholder="Например: ${esc(S.profile.experienceSummary || '2 года в маркетинге, Яндекс Директ, контент, аналитика, AI-инструменты')}"></textarea></div>
      <div class="input-block"><div class="input-label"><span>🎯</span> Целевая вакансия</div><textarea id="job-input" placeholder="Вставь описание вакансии или опиши целевую роль: ${esc(S.profile.targetRole || 'Product Marketing Manager')}"></textarea></div>
    </div>
    <button class="analyze-btn" id="analyze-btn" data-action="run-analysis">🤖 Анализировать и собрать путь</button>
    <div class="loading" id="analysis-loading"><div class="spinner"></div><div class="loading-text">AI анализирует профиль...</div><div class="loading-steps" id="loading-step">Сопоставляю навыки с требованиями</div></div>
    <div class="results-container ${S.gapResults ? 'show' : ''}" id="analysis-results">
      <div style="display:flex;align-items:center;justify-content:space-between;margin:24px 0 16px"><div style="font-family:var(--display);font-size:13px;font-weight:700">Анализ гэпов</div><button class="btn btn-ghost" data-action="add-all-to-plan">+ Добавить всё в план</button></div>
      <div id="gaps-grid" class="skill-gap-grid"></div><div style="font-family:var(--display);font-size:13px;font-weight:700;margin:24px 0 16px">AI Рекомендации</div><div id="ai-summary" class="card"></div>
    </div>`;
  if (S.gapResults) renderResults(S.gapResults);
}

async function runAnalysis() {
  const resume = document.getElementById('resume-input')?.value.trim() || S.profile.experienceSummary || '';
  const job = document.getElementById('job-input')?.value.trim() || S.profile.targetRole || '';
  if (!job.trim()) return showNotif('⚠️ Заполни описание вакансии или целевую роль');
  const btn = document.getElementById('analyze-btn');
  const loading = document.getElementById('analysis-loading');
  const results = document.getElementById('analysis-results');
  btn.disabled = true; loading.classList.add('show'); results.classList.remove('show');
  const steps = ['Анализирую опыт...', 'Ищу гэпы...', 'Формирую план...', 'Генерирую карту заданий...', 'Готовлю интервью...'];
  let i = 0;
  const interval = setInterval(() => setText('loading-step', steps[Math.min(i++, steps.length - 1)]), 900);
  try {
    const data = await callAI('career_analysis', { profile: S.profile, resume, job });
    S.gapResults = data.analysis;
    S.plan = mergePlan(S.plan, data.plan || []);
    S.taskMap = Array.isArray(data.taskMap) ? data.taskMap : [];
    S.interviewQuestions = Array.isArray(data.interviewQuestions) ? data.interviewQuestions : [];
    save();
    renderResults(S.gapResults);
    renderPlan(); renderTaskMap(); renderInterview(); renderHome();
    addXP(80, 'AI-анализ завершён');
  } catch (e) {
    showError(results, `AI не сработал: ${e.message}\n\nПроверь: Edge Function задеплоена, OPENROUTER_API_KEY добавлен в Supabase secrets, баланс OpenRouter не нулевой.`);
  } finally {
    clearInterval(interval); btn.disabled = false; loading.classList.remove('show'); results.classList.add('show');
  }
}

function mergePlan(oldPlan, newPlan) {
  const bySkill = new Map(oldPlan.map(item => [item.skill.toLowerCase(), item]));
  for (const item of newPlan) {
    if (!item?.skill) continue;
    const key = item.skill.toLowerCase();
    if (!bySkill.has(key)) bySkill.set(key, { id: uid('plan'), done:false, ...item });
  }
  return [...bySkill.values()];
}

function renderResults(data) {
  const grid = document.getElementById('gaps-grid');
  const summary = document.getElementById('ai-summary');
  if (!grid || !summary || !data) return;
  const gaps = Array.isArray(data.gaps) ? data.gaps : [];
  grid.innerHTML = gaps.map((g, idx) => `
    <div class="gap-card ${esc(g.priority || 'important')}">
      <div class="gap-priority">${esc(g.priority || 'important')}</div><div class="gap-skill">${esc(g.skill)}</div><div class="gap-desc">${esc(g.description || '')}</div>
      <div class="gap-bar-wrap"><div class="gap-bar" style="width:${Number(g.current_level || 0)}%"></div></div><div class="gap-bar-labels"><span>сейчас ${Number(g.current_level || 0)}%</span><span>нужно ${Number(g.required_level || 0)}%</span></div>
      <button class="add-to-plan" data-action="add-gap" data-gap-index="${idx}">+ В план</button>
    </div>`).join('');
  summary.innerHTML = `<div class="card-sub"><strong style="color:var(--green)">Вывод:</strong> ${esc(data.summary || '')}<br><br><strong>Сильные стороны:</strong> ${(data.strengths || []).map(esc).join(', ') || '—'}<br><br><strong>План:</strong> ${esc(data.action_plan || '')}</div>`;
}

function addGapToPlan(index) {
  const gap = S.gapResults?.gaps?.[index];
  if (!gap) return;
  S.plan = mergePlan(S.plan, [{
    skill: gap.skill,
    priority: gap.priority || 'important',
    desc: gap.description || '',
    quick_win: gap.quick_win || '',
    resources: gap.resources || [],
    steps: gap.steps || []
  }]);
  save(); renderPlan(); renderHome(); addXP(25, 'навык добавлен в план');
}

function addAllToPlan() {
  const gaps = S.gapResults?.gaps || [];
  S.plan = mergePlan(S.plan, gaps.map(g => ({ skill:g.skill, priority:g.priority, desc:g.description, quick_win:g.quick_win, resources:g.resources || [], steps:g.steps || [] })));
  save(); renderPlan(); renderHome(); addXP(40, 'план обновлён');
}

function renderPlan() {
  const el = document.getElementById('view-plan');
  if (!el) return;
  el.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px"><div><div style="font-family:var(--display);font-size:15px;font-weight:700;margin-bottom:4px">Мой план развития</div><div style="font-size:12px;color:var(--mid)">Навыки из AI-анализа с действиями и ресурсами</div></div></div><div id="plan-list">${planHtml()}</div>`;
}

function planHtml() {
  if (!S.plan.length) return `<div class="empty"><div class="empty-icon">📋</div>Пока нет навыков в плане.<br>Запусти AI-анализ.</div>`;
  return S.plan.map(item => `
    <div class="plan-item ${item.done ? 'done' : ''}" data-plan-id="${esc(item.id)}">
      <div class="plan-header" data-action="toggle-plan-open" data-plan-id="${esc(item.id)}"><div class="plan-check" data-action="toggle-plan-done" data-plan-id="${esc(item.id)}"><span class="plan-check-icon">✓</span></div><div class="plan-info"><div class="plan-skill">${esc(item.skill)}</div><div class="plan-meta"><span class="plan-tag pt-${esc(item.priority || 'important')}">${esc(item.priority || 'important')}</span><span class="plan-tag pt-xp">+40 XP</span></div></div><div class="plan-expand">⌄</div></div>
      <div class="plan-body"><div class="resources-grid"><div class="res-section-label">Почему важно</div><div class="card-sub">${esc(item.desc || item.description || '')}</div>${item.quick_win ? `<div class="res-section-label">Quick win</div><div class="card-sub">${esc(item.quick_win)}</div>` : ''}${resourcesHtml(item.resources)}</div></div>
    </div>`).join('');
}

function resourcesHtml(resources = []) {
  if (!Array.isArray(resources) || !resources.length) return '';
  return `<div class="res-section-label">Ресурсы</div>${resources.map(r => `<a class="resource-link" href="${safeUrl(r.url)}" target="_blank" rel="noreferrer"><span class="rl-icon">${esc(r.icon || '🔗')}</span><span class="rl-info"><span class="rl-title">${esc(r.title || r.name || 'Ресурс')}</span><span class="rl-sub">${esc(r.description || '')}</span></span><span class="rl-badge">${esc(r.type || 'link')}</span></a>`).join('')}`;
}

function renderTaskMap() {
  const el = document.getElementById('view-taskmap');
  if (!el) return;
  const total = countTasks(S.taskMap);
  const done = Object.values(S.tmDone || {}).filter(Boolean).length;
  el.innerHTML = `<div style="margin-bottom:20px"><div style="font-family:var(--display);font-size:15px;font-weight:700;margin-bottom:4px">Карта заданий</div><div style="font-size:12px;color:var(--mid)">Персональные задания под роль, проект и гэпы</div></div><div class="regenerate-bar"><button class="btn btn-ghost" data-action="generate-taskmap">Перегенерировать через AI</button></div><div class="tm-filter-bar"><button class="tm-filter ${tmFilterValue==='all'?'active':''}" data-tm-filter="all">Все</button><button class="tm-filter ${tmFilterValue==='active'?'active':''}" data-tm-filter="active">В процессе</button><button class="tm-filter ${tmFilterValue==='done'?'active':''}" data-tm-filter="done">Выполненные</button><div style="margin-left:auto;font-size:11px;color:var(--mid)">Выполнено: <b style="color:var(--green)">${done}</b> / <b>${total}</b></div></div><div id="tm-blocks">${taskMapHtml()}</div>`;
}

function countTasks(blocks = []) {
  return blocks.reduce((sum, block) => sum + (Array.isArray(block.tasks) ? block.tasks.length : 0), 0);
}

function taskMapHtml() {
  if (!S.taskMap.length) return `<div class="empty"><div class="empty-icon">🗺️</div>Карта заданий появится после AI-анализа.<br>Можно также нажать «Перегенерировать через AI».</div>`;
  return S.taskMap.map((block, bi) => {
    const tasks = (block.tasks || []).filter(t => tmFilterValue === 'all' || (tmFilterValue === 'done' ? S.tmDone[t.id] : !S.tmDone[t.id]));
    if (!tasks.length) return '';
    const done = (block.tasks || []).filter(t => S.tmDone[t.id]).length;
    return `<div class="tm-block"><div class="tm-block-header"><div class="tm-block-num">${String(bi+1).padStart(2,'0')}</div><div class="tm-block-title">${esc(block.title || 'Блок')}</div><div class="tm-block-prog"><b>${done}</b>/${(block.tasks || []).length}</div><div class="tm-chevron">⌄</div></div><div class="tm-block-body">${tasks.map(taskHtml).join('')}</div></div>`;
  }).join('');
}

function taskHtml(t) {
  const note = S.tmNotes?.[t.id] || '';
  return `<div class="tm-task ${S.tmDone[t.id] ? 'done' : ''}" data-task-id="${esc(t.id)}"><div class="tm-task-head" data-action="toggle-task-open" data-task-id="${esc(t.id)}"><div class="tm-chk" data-action="toggle-task-done" data-task-id="${esc(t.id)}"><span class="tm-chk-icon">✓</span></div><div class="tm-task-info"><div class="tm-task-title">${esc(t.title)}</div><div class="tm-task-tags">${(t.tags || []).map(tag => `<span class="tm-tag tmt-ai">${esc(tag)}</span>`).join('')}</div></div><div class="tm-expand">⌄</div></div><div class="tm-body"><div class="tm-section"><div class="tm-sec-label">Цель</div><div class="tm-goal-text">${esc(t.goal || '')}</div></div><div class="tm-section"><div class="tm-sec-label">Шаги</div><ol class="tm-steps">${(t.steps || []).map((s, i) => `<li><span class="tm-step-n">${i+1}</span><span class="tm-step-text">${esc(s)}</span></li>`).join('')}</ol></div>${toolsHtml(t.tools)}<div class="tm-section"><div class="tm-sec-label">Метрики</div><div class="tm-metrics">${(t.metrics || []).map(m => `<div class="tm-metric"><div class="tm-metric-name">${esc(m)}</div><input class="field-input" data-metric-task="${esc(t.id)}" data-metric-name="${esc(m)}" value="${esc(S.tmMetrics?.[t.id]?.[m] || '')}" placeholder="значение"></div>`).join('')}</div></div><textarea class="tm-note-area" data-note-task="${esc(t.id)}" placeholder="Заметки / отчёт по задаче">${esc(note)}</textarea></div></div>`;
}

function toolsHtml(tools = []) {
  if (!Array.isArray(tools) || !tools.length) return '';
  return `<div class="tm-section"><div class="tm-sec-label">Инструменты</div><div class="tm-tools-list">${tools.map(tool => `<a class="tm-tool" href="${safeUrl(tool.url)}" target="_blank" rel="noreferrer"><span class="tm-tool-icon">${esc(tool.icon || '🔧')}</span><span class="tm-tool-info"><span class="tm-tool-name">${esc(tool.name || tool.title)}</span><span class="tm-tool-desc">${esc(tool.description || '')}</span></span><span class="tm-tool-type">${esc(tool.type || 'tool')}</span></a>`).join('')}</div></div>`;
}

async function generateTaskMap() {
  try {
    const data = await callAI('task_map', { profile: S.profile, plan: S.plan, gaps: S.gapResults?.gaps || [] });
    S.taskMap = data.taskMap || [];
    save(); renderTaskMap(); addXP(40, 'карта заданий обновлена');
  } catch (e) { showNotif(`⚠️ ${e.message}`); }
}

function renderAchievements() {
  const el = document.getElementById('view-achievements');
  if (!el) return;
  el.innerHTML = `<div style="margin-bottom:20px"><div style="font-family:var(--display);font-size:15px;font-weight:700;margin-bottom:4px">Мои достижения</div><div style="font-size:12px;color:var(--mid)">Документируй результаты — они формируют резюме</div></div><div id="achievements-list">${achievementsHtml()}</div><div style="font-family:var(--display);font-size:13px;font-weight:700;margin:24px 0 16px">+ Добавить достижение</div><div class="achievement-input"><div class="ai-header"><div class="ai-title">Новое достижение</div><button class="ai-action" data-action="generate-ach-line">✨ AI сформулирует строку</button></div><div class="ai-fields"><div class="field-group"><div class="field-label">Что сделал</div><input type="text" class="field-input" id="ach-what" placeholder="Запустил контент-стратегию для ${esc(projectName())}"></div><div class="field-group"><div class="field-label">Метрика</div><input type="text" class="field-input" id="ach-metric" placeholder="15 лидов, -23% CPL, +3000 просмотров"></div><div class="field-group"><div class="field-label">Период</div><input type="text" class="field-input" id="ach-period" placeholder="за 2 месяца"></div><div class="generated-line empty" id="ach-line">Заполни поля и нажми «AI сформулирует строку»</div><div style="display:flex;gap:8px"><button class="copy-line-btn" data-action="copy-ach-line">📋 Копировать</button><button class="btn btn-green" data-action="save-achievement" style="font-size:10px;padding:7px 14px">💾 Сохранить</button></div></div></div>`;
}

function achievementsHtml() {
  if (!S.achievements.length) return `<div class="empty"><div class="empty-icon">🏆</div>Пока нет достижений.</div>`;
  return S.achievements.slice().reverse().map(a => `<div class="achievement-input"><div class="ai-header"><div class="ai-title">${esc(a.what)}</div><button class="ai-action" data-action="delete-achievement" data-ach-id="${esc(a.id)}">Удалить</button></div><div class="ai-fields"><div class="generated-line">${esc(a.line)}</div><div class="card-sub">${esc(a.metric)} · ${esc(a.period)} · ${new Date(a.date).toLocaleDateString('ru-RU')}</div></div></div>`).join('');
}

async function generateAchLine() {
  const what = document.getElementById('ach-what')?.value.trim();
  const metric = document.getElementById('ach-metric')?.value.trim();
  const period = document.getElementById('ach-period')?.value.trim();
  const line = document.getElementById('ach-line');
  if (!what || !metric) return showNotif('Заполни действие и метрику');
  line.textContent = 'Генерирую...'; line.classList.remove('empty');
  try {
    const data = await callAI('achievement_line', { profile:S.profile, what, metric, period });
    line.textContent = data.line || `${what}: ${metric}${period ? ` ${period}` : ''}`;
  } catch (e) {
    line.textContent = `${what}: достиг ${metric}${period ? ` ${period}` : ''}.`;
    showNotif(`AI недоступен, сделал простую строку`);
  }
}

function saveAchievement() {
  const what = document.getElementById('ach-what')?.value.trim();
  const metric = document.getElementById('ach-metric')?.value.trim();
  const period = document.getElementById('ach-period')?.value.trim();
  const lineEl = document.getElementById('ach-line');
  const line = lineEl?.classList.contains('empty') ? '' : lineEl?.textContent.trim();
  if (!what || !metric || !line) return showNotif('Сначала заполни поля и сформулируй строку');
  S.achievements.push({ id:uid('ach'), what, metric, period, line, date:new Date().toISOString() });
  save(); renderAchievements(); renderResume(); renderHome(); addXP(35, 'достижение сохранено');
}

function renderInterview() {
  const el = document.getElementById('view-interview');
  if (!el) return;
  el.innerHTML = `<div style="margin-bottom:20px"><div style="font-family:var(--display);font-size:15px;font-weight:700;margin-bottom:4px">Подготовка к интервью</div><div style="font-size:12px;color:var(--mid)">Вопросы на основе твоего плана и целевой роли</div></div><div class="regenerate-bar"><button class="btn btn-ghost" data-action="generate-interview">Перегенерировать через AI</button></div><div id="interview-questions">${interviewHtml()}</div>`;
}

function interviewHtml() {
  if (!S.interviewQuestions.length) return `<div class="empty"><div class="empty-icon">🎯</div>Вопросы появятся после AI-анализа.</div>`;
  return S.interviewQuestions.map((q, i) => `<div class="interview-card"><div class="q-num">Вопрос ${i+1} · ${esc(q.skill || S.profile.targetRole || 'роль')}</div><div class="q-text">${esc(q.q || q.question)}</div><div class="q-tips"><div class="q-tips-label">Что раскрыть</div><ul>${(q.tips || []).map(t => `<li>${esc(t)}</li>`).join('')}</ul></div><textarea class="answer-area" data-answer-id="${esc(q.id || `q_${i}`)}" placeholder="Напиши ответ по STAR / Situation–Task–Action–Result">${esc(S.answers[q.id || `q_${i}`] || '')}</textarea><div class="answer-footer"><button class="save-answer-btn" data-action="save-answer" data-answer-id="${esc(q.id || `q_${i}`)}">Сохранить ответ</button></div></div>`).join('');
}

async function generateInterview() {
  try {
    const data = await callAI('interview_questions', { profile:S.profile, plan:S.plan, gaps:S.gapResults?.gaps || [], achievements:S.achievements });
    S.interviewQuestions = data.interviewQuestions || [];
    save(); renderInterview(); addXP(30, 'интервью обновлено');
  } catch (e) { showNotif(`⚠️ ${e.message}`); }
}

function renderResume() {
  const el = document.getElementById('view-resume');
  if (!el) return;
  const role = S.profile.currentRole || 'Опыт';
  const project = projectName();
  const achievements = S.achievements.length ? S.achievements.map(a => `• ${a.line}`).join('\n') : 'Добавь достижения, чтобы здесь появились сильные bullet points.';
  const skills = [...new Set(S.plan.filter(p => p.done).map(p => p.skill).concat(S.plan.map(p => p.skill).slice(0, 8)))].join(', ') || 'Навыки появятся после анализа и выполнения задач.';
  el.innerHTML = `<div style="margin-bottom:20px"><div style="font-family:var(--display);font-size:15px;font-weight:700;margin-bottom:4px">Резюме-конструктор</div><div style="font-size:12px;color:var(--mid)">Автоматически собирается из профиля, достижений и закрытых навыков</div></div><div class="card"><div class="card-title">Блок «Опыт» — ${esc(project)}</div><pre id="resume-experience" style="font-size:12px;color:var(--mid);font-family:'Courier New',monospace;line-height:1.9;white-space:pre-wrap">${esc(`${role} · ${project}\n${achievements}`)}</pre><button class="btn btn-ghost" data-copy-id="resume-experience" style="font-size:10px">📋 Копировать</button></div><div class="card"><div class="card-title">Навыки</div><pre id="resume-skills" style="font-size:12px;color:var(--mid);font-family:'Courier New',monospace;line-height:1.9;white-space:pre-wrap">${esc(skills)}</pre><button class="btn btn-ghost" data-copy-id="resume-skills" style="font-size:10px">📋 Копировать</button></div>`;
}

function openProfile() {
  document.getElementById('profile-name').value = S.profile.name || '';
  document.getElementById('profile-current-role').value = S.profile.currentRole || '';
  document.getElementById('profile-target-role').value = S.profile.targetRole || '';
  document.getElementById('profile-project').value = S.profile.project || '';
  document.getElementById('profile-market').value = S.profile.market || '';
  document.getElementById('profile-experience').value = S.profile.experienceSummary || '';
  document.getElementById('onboarding-screen').classList.add('show');
}

function saveProfile() {
  S.profile = {
    ...S.profile,
    name: document.getElementById('profile-name').value.trim(),
    currentRole: document.getElementById('profile-current-role').value.trim(),
    targetRole: document.getElementById('profile-target-role').value.trim(),
    project: document.getElementById('profile-project').value.trim(),
    market: document.getElementById('profile-market').value.trim(),
    experienceSummary: document.getElementById('profile-experience').value.trim()
  };
  if (!S.profile.name || !S.profile.currentRole || !S.profile.targetRole) return showNotif('Имя, текущая роль и целевая роль обязательны');
  save(); document.getElementById('onboarding-screen').classList.remove('show'); renderAll(); showNotif('Профиль сохранён');
}

function renderAll() {
  setUserUi(); updateXPUI(); renderBadges(); renderHome(); renderAnalyzer(); renderPlan(); renderTaskMap(); renderAchievements(); renderInterview(); renderResume();
}

function setUserUi() {
  const email = currentUser?.email || '';
  setText('user-email', email);
  setText('user-avatar', displayName()[0]?.toUpperCase() || email[0]?.toUpperCase() || 'U');
}

function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(el => el.classList.toggle('active', el.dataset.authTab === tab));
  document.getElementById('auth-form-login').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('auth-form-register').style.display = tab === 'register' ? 'block' : 'none';
}

async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  if (!email || !password) return setText('login-error', 'Заполни email и пароль');
  const { error } = await sb.auth.signInWithPassword({ email, password });
  setText('login-error', error ? authError(error.message) : '');
}

async function doRegister() {
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  if (!email || !password) return setText('reg-error', 'Заполни все поля');
  if (password.length < 6) return setText('reg-error', 'Пароль минимум 6 символов');
  const { error } = await sb.auth.signUp({ email, password, options:{ emailRedirectTo: window.location.origin + window.location.pathname } });
  setText('reg-error', error ? authError(error.message) : '');
  setText('reg-success', error ? '' : '✓ Проверь почту и подтверди email');
}

async function doResetPassword() {
  const email = document.getElementById('login-email').value.trim();
  if (!email) return setText('login-error', 'Введи email для сброса пароля');
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + window.location.pathname });
  setText('login-error', error ? authError(error.message) : 'Письмо для сброса отправлено');
}

async function doGoogleAuth() {
  await sb.auth.signInWithOAuth({ provider:'google', options:{ redirectTo: window.location.origin + window.location.pathname } });
}

async function doLogout() { await sb.auth.signOut(); }

function authError(msg) {
  if (msg.includes('Invalid login')) return 'Неверный email или пароль';
  if (msg.includes('Email not confirmed')) return 'Подтверди email — проверь почту';
  if (msg.includes('already registered')) return 'Этот email уже зарегистрирован';
  if (msg.includes('rate limit')) return 'Слишком много попыток, подожди немного';
  return msg;
}

function showError(container, message) {
  container.classList.add('show');
  container.innerHTML = `<div class="error-box">${esc(message)}</div>`;
}

function navigate(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(`view-${id}`)?.classList.add('active');
  document.querySelectorAll('.sb-item').forEach(i => i.classList.toggle('active', i.dataset.nav === id));
  const titles = { home:'Дашборд', analyzer:'AI Анализ гэпов', plan:'Мой план', taskmap:'Карта заданий', achievements:'Достижения', interview:'Подготовка к интервью', resume:'Резюме-конструктор' };
  setText('tb-title', titles[id] || id);
}

function installEvents() {
  document.addEventListener('click', async (e) => {
    const nav = e.target.closest('[data-nav]');
    if (nav) return navigate(nav.dataset.nav);
    const tab = e.target.closest('[data-auth-tab]');
    if (tab) return switchAuthTab(tab.dataset.authTab);
    const copy = e.target.closest('[data-copy-id]');
    if (copy) { await navigator.clipboard.writeText(document.getElementById(copy.dataset.copyId).textContent); return showNotif('Скопировано'); }
    const actionEl = e.target.closest('[data-action]');
    if (!actionEl) return;
    const action = actionEl.dataset.action;
    if (action === 'login') return doLogin();
    if (action === 'register') return doRegister();
    if (action === 'reset-password') return doResetPassword();
    if (action === 'google-auth') return doGoogleAuth();
    if (action === 'logout') return doLogout();
    if (action === 'open-profile') return openProfile();
    if (action === 'close-onboarding') return document.getElementById('onboarding-screen').classList.remove('show');
    if (action === 'save-profile') return saveProfile();
    if (action === 'run-analysis') return runAnalysis();
    if (action === 'add-gap') return addGapToPlan(Number(actionEl.dataset.gapIndex));
    if (action === 'add-all-to-plan') return addAllToPlan();
    if (action === 'toggle-plan-open') return document.querySelector(`[data-plan-id="${CSS.escape(actionEl.dataset.planId)}"]`)?.classList.toggle('open');
    if (action === 'toggle-plan-done') { e.stopPropagation(); const item=S.plan.find(p=>p.id===actionEl.dataset.planId); if(item){item.done=!item.done; if(item.done)addXP(40,'навык закрыт'); save(); renderPlan(); renderHome(); renderResume();} return; }
    if (action === 'toggle-task-open') return document.querySelector(`.tm-task[data-task-id="${CSS.escape(actionEl.dataset.taskId)}"]`)?.classList.toggle('open');
    if (action === 'toggle-task-done') { e.stopPropagation(); S.tmDone[actionEl.dataset.taskId]=!S.tmDone[actionEl.dataset.taskId]; if(S.tmDone[actionEl.dataset.taskId]) addXP(30,'задание закрыто'); save(); renderTaskMap(); renderHome(); return; }
    if (action === 'generate-taskmap') return generateTaskMap();
    if (action === 'generate-interview') return generateInterview();
    if (action === 'generate-ach-line') return generateAchLine();
    if (action === 'save-achievement') return saveAchievement();
    if (action === 'copy-ach-line') { await navigator.clipboard.writeText(document.getElementById('ach-line').textContent); return showNotif('Скопировано'); }
    if (action === 'delete-achievement') { S.achievements = S.achievements.filter(a=>a.id!==actionEl.dataset.achId); save(); renderAchievements(); renderResume(); renderHome(); return; }
    if (action === 'save-answer') { const id=actionEl.dataset.answerId; const ta=document.querySelector(`[data-answer-id="${CSS.escape(id)}"]`); S.answers[id]=ta.value; save(); checkBadges(); showNotif('Ответ сохранён'); return; }
  });
  document.addEventListener('input', (e) => {
    if (e.target.matches('[data-note-task]')) { S.tmNotes[e.target.dataset.noteTask] = e.target.value; save(); }
    if (e.target.matches('[data-metric-task]')) { const id=e.target.dataset.metricTask; const name=e.target.dataset.metricName; S.tmMetrics[id] ||= {}; S.tmMetrics[id][name] = e.target.value; save(); }
  });
  document.addEventListener('click', (e) => {
    const filter = e.target.closest('[data-tm-filter]');
    if (filter) { tmFilterValue = filter.dataset.tmFilter; renderTaskMap(); }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.id === 'login-password') doLogin(); if (e.key === 'Enter' && e.target.id === 'reg-password') doRegister(); });
}

sb.auth.onAuthStateChange(async (_event, session) => {
  if (session?.user) {
    currentUser = session.user;
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'flex';
    localLoad();
    await loadFromCloud();
    renderViews();
    renderAll();
    setSyncStatus('ok');
    if (!hasProfile()) openProfile();
  } else {
    currentUser = null;
    document.getElementById('main-app').style.display = 'none';
    document.getElementById('auth-screen').style.display = 'flex';
  }
});

renderShell();
renderViews();
installEvents();
sb.auth.getSession().then(({ data }) => {
  if (!data.session) {
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('main-app').style.display = 'none';
  }
});