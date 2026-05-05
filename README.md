# CareerPath AI — MVP refactor

Что исправлено:

- прямой вызов Anthropic из браузера заменён на Supabase Edge Function `ai-proxy`;
- ключ Anthropic хранится только в Supabase secrets;
- убран хардкод «Иван» / «GRUZAPP»: добавлен onboarding-профиль;
- AI-анализ сразу возвращает gaps, plan, taskMap, interviewQuestions;
- карта заданий и интервью стали персональными;
- проект разбит на Vite-структуру: `index.html`, `src/main.js`, `src/styles.css`;
- добавлена миграция Supabase RLS для `user_data`;
- добавлен UX сброса пароля;
- добавлены базовые миграции localStorage и экранирование HTML.

## 1. Локальный запуск

```bash
cp .env.example .env
npm install
npm run dev
```

## 2. Supabase

Применить миграцию:

```bash
supabase db push
```

Или вручную выполнить SQL из:

```text
supabase/migrations/0001_user_data_rls.sql
```

## 3. Edge Function

```bash
supabase functions deploy ai-proxy
supabase secrets set ANTHROPIC_API_KEY=sk-ant-your-key
```

Опционально можно сменить модель:

```bash
supabase secrets set ANTHROPIC_MODEL=claude-opus-4-7
```

## 4. Supabase Auth URLs

В Supabase Dashboard → Authentication → URL Configuration:

- Site URL: production URL на Vercel/Netlify;
- Redirect URLs: local dev URL и production URL.

Пример:

```text
http://localhost:5173/**
https://your-domain.com/**
```

## 5. Деплой на Vercel

```bash
npm run build
```

В Vercel добавить env:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_AI_PROXY_FUNCTION=ai-proxy
```

Важно: `ANTHROPIC_API_KEY` добавляется не в Vercel, а в Supabase secrets для Edge Function.

## Что ещё стоит сделать после MVP

- rate limit на Edge Function по user id;
- usage logging по токенам и стоимости;
- отдельная таблица `profiles`, если появится публичный профиль;
- полноценные email templates в Supabase Auth;
- E2E-тесты auth → onboarding → analysis → save.
