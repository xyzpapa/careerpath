// База знаний CareerPath AI
// Каждая сфера содержит: фреймворки, методики, инструменты с URL, метрики, шаблоны заданий
// Ты можешь дополнять и редактировать — AI будет использовать эту базу для генерации карточек

export const KNOWLEDGE_BASE = {

  product_management: {
    name: 'Product Management',
    keywords: ['product', 'продакт', 'pm', 'продукт', 'product manager', 'product owner', 'менеджер продукта'],

    frameworks: [
      { name: 'Jobs-to-be-Done (JTBD)', desc: 'Понимание задач пользователя: "На какую работу клиент нанимает продукт?"', how: 'Сформулируй 5 Jobs для своего продукта в формате: "Когда [ситуация], я хочу [мотивация], чтобы [результат]"' },
      { name: 'RICE Prioritization', desc: 'Приоритизация фич: Reach × Impact × Confidence / Effort', how: 'Создай таблицу в Notion/Google Sheets, внеси 10 идей фич, оцени каждую по RICE, отсортируй' },
      { name: 'Impact Mapping', desc: 'Связь бизнес-целей → акторов → воздействий → фич', how: 'Нарисуй Impact Map в Miro: цель в центре → кто влияет → как влияет → что делаем' },
      { name: 'Lean Canvas', desc: '1-страничная бизнес-модель: проблема, решение, метрики, каналы, преимущество', how: 'Заполни Lean Canvas на leanstack.com за 30 минут, валидируй с 3 людьми из ЦА' },
      { name: 'Kano Model', desc: 'Классификация фич: must-have / performance / delighter / indifferent / reverse', how: 'Проведи опрос 10 пользователей: "Как вы отнесётесь если фича будет / не будет?" — построй матрицу' },
      { name: 'North Star Metric', desc: 'Одна метрика отражающая core value продукта для юзера', how: 'Определи NSM: для Spotify это "время прослушивания", для Airbnb "ночи забронированы". Какая у тебя?' },
      { name: 'OKR (Objectives & Key Results)', desc: 'Цели + измеримые результаты на квартал', how: 'Напиши 1 Objective + 3 Key Results на ближайший квартал. KR должны быть числовыми.' },
    ],

    methodologies: [
      { name: 'Customer Development', desc: 'Валидация гипотез через интервью с клиентами', steps: ['Сформулируй 3 гипотезы о проблемах ЦА', 'Составь скрипт из 10 открытых вопросов (без наводящих)', 'Проведи 5 интервью по 30 минут', 'Выпиши паттерны: что повторяется у 3+ людей', 'Переформулируй гипотезы на основе данных'] },
      { name: 'A/B тестирование', desc: 'Проверка гипотез через сплит-тест', steps: ['Сформулируй гипотезу: "Если [изменение], то [метрика] вырастет на [X]%"', 'Рассчитай размер выборки на calculators.io/sample-size', 'Настрой эксперимент в Google Optimize / PostHog / Amplitude', 'Дождись статистической значимости (p < 0.05)', 'Зафиксируй результат и решение: ship / kill / iterate'] },
      { name: 'User Story Mapping', desc: 'Визуализация пользовательского пути для планирования релизов', steps: ['Определи основные активности юзера (горизонталь)', 'Под каждой активностью — конкретные шаги (вертикаль)', 'Проведи горизонтальную линию: всё выше = MVP, ниже = backlog', 'Валидируй карту с 2-3 юзерами', 'Разбей на спринты по горизонтальным слоям'] },
      { name: 'Sprint Planning', desc: 'Планирование 2-недельного спринта', steps: ['Возьми из бэклога топ по приоритету (RICE)', 'Декомпозируй каждую фичу до задач ≤4 часов', 'Оцени capacity команды в story points', 'Не бери больше чем 70% capacity (буфер на баги)', 'Определи Sprint Goal одним предложением'] },
      { name: 'Product Discovery', desc: 'Двойной трек: Discovery (что строить) + Delivery (как строить)', steps: ['Собери топ-10 запросов от клиентов/стейкхолдеров', 'Для каждого определи: это проблема или решение?', 'Переформулируй решения в проблемы', 'Проведи Opportunity Solution Tree: цель → возможности → решения → эксперименты', 'Выбери 1-2 эксперимента на неделю'] },
    ],

    tools: [
      { name: 'Figma', url: 'https://figma.com', desc: 'Прототипирование и дизайн интерфейсов', type: 'design' },
      { name: 'Miro', url: 'https://miro.com', desc: 'Визуальные доски для стратегии, impact maps, CJM', type: 'strategy' },
      { name: 'Notion', url: 'https://notion.so', desc: 'Документация продукта, PRD, roadmap, wiki', type: 'docs' },
      { name: 'Amplitude', url: 'https://amplitude.com', desc: 'Продуктовая аналитика: воронки, retention, когорты', type: 'analytics' },
      { name: 'Hotjar', url: 'https://hotjar.com', desc: 'Тепловые карты, записи сессий, опросы на сайте', type: 'research' },
      { name: 'Linear', url: 'https://linear.app', desc: 'Трекер задач для продуктовых команд', type: 'project' },
      { name: 'PostHog', url: 'https://posthog.com', desc: 'Open-source аналитика + feature flags + A/B тесты', type: 'analytics' },
      { name: 'Loom', url: 'https://loom.com', desc: 'Видеосообщения для async-коммуникации с командой', type: 'communication' },
    ],

    metrics: ['DAU/MAU', 'Retention D1/D7/D30', 'Activation Rate', 'Time to Value', 'NPS', 'CSAT', 'Churn Rate', 'LTV', 'CAC', 'Feature Adoption Rate', 'Task Success Rate'],

    task_templates: [
      { title: 'Провести 5 Customer Development интервью', goal: 'Валидировать гипотезы о проблемах ЦА через реальные разговоры', tags: ['research', 'practice'], detailed_steps: ['Определи свою ЦА: кто эти люди, где их найти', 'Напиши скрипт интервью: 10 открытых вопросов без наводящих (шаблон: bit.ly/custdev-script)', 'Найди 5 респондентов: напиши в профильные чаты, LinkedIn, попроси друзей', 'Проведи интервью: 30 мин каждое, записывай (с разрешения) на Loom/Zoom', 'После каждого интервью заполни карточку: цитата, инсайт, паттерн', 'Сведи результаты в таблицу: что повторяется у 3+ человек = валидированная проблема'], metrics: ['Количество проведённых интервью', 'Количество валидированных гипотез', 'Количество новых инсайтов'] },
      { title: 'Составить PRD на ключевую фичу', goal: 'Написать Product Requirements Document по шаблону', tags: ['docs', 'practice'], detailed_steps: ['Выбери фичу из бэклога с наивысшим RICE-скором', 'Открой шаблон PRD в Notion (шаблон: notion.so/templates/prd)', 'Заполни секции: Проблема, Цель, Метрики успеха, User Stories, Scope (in/out)', 'Добавь мокапы из Figma или wireframes от руки (фото тоже ок)', 'Отправь на ревью 2 людям (коллега + потенциальный юзер)', 'Внеси правки, зафиксируй финальную версию'], metrics: ['PRD написан и согласован', 'Количество user stories', 'Определены метрики успеха'] },
      { title: 'Построить воронку активации и найти drop-off', goal: 'Найти где юзеры отваливаются между регистрацией и aha-момент', tags: ['analytics', 'practice'], detailed_steps: ['Определи свой aha-момент: какое действие = юзер понял ценность', 'Нарисуй воронку: регистрация → онбординг → первое действие → aha → повторный визит', 'Настрой события в Amplitude/PostHog/Mixpanel', 'Подожди 7 дней, собери данные по когорте', 'Найди самый большой drop-off (где теряется >30% юзеров)', 'Сформулируй 3 гипотезы почему отваливаются'], metrics: ['Conversion rate по каждому шагу воронки', 'Самый большой drop-off в %', 'Количество гипотез для теста'] },
    ]
  },

  growth_marketing: {
    name: 'Growth / Performance Marketing',
    keywords: ['growth', 'performance', 'маркетинг', 'маркетолог', 'growth marketing', 'digital marketing', 'перформанс', 'трафик', 'реклама', 'таргет'],

    frameworks: [
      { name: 'AARRR (Pirate Metrics)', desc: 'Acquisition → Activation → Retention → Revenue → Referral', how: 'Для каждого этапа определи: ключевую метрику, текущее значение, целевое, 1 эксперимент для роста' },
      { name: 'ICE Scoring', desc: 'Приоритизация growth-экспериментов: Impact × Confidence × Ease', how: 'Запиши 10 идей экспериментов, оцени каждый по ICE (1-10), отсортируй, запусти топ-3' },
      { name: 'Bullseye Framework', desc: '19 каналов привлечения → 6 для теста → 3 для фокуса → 1 главный', how: 'Пройди все 19 каналов (Traction book), выбери 6 для теста за $100 каждый, измерь CAC' },
      { name: 'Growth Loop', desc: 'Замкнутый цикл роста вместо воронки: input → action → output → input', how: 'Нарисуй свой growth loop: как один юзер приводит следующего? Где цикл замыкается?' },
      { name: 'Unit-экономика', desc: 'LTV > CAC — базовое условие жизнеспособности бизнеса', how: 'Рассчитай: CAC = расходы на маркетинг / новые клиенты, LTV = ARPU × Lifetime. LTV/CAC > 3 = хорошо' },
    ],

    methodologies: [
      { name: 'Запуск рекламной кампании в Яндекс Директ', desc: 'Полный цикл: от регистрации до оптимизации', steps: ['Зарегистрируйся на direct.yandex.ru → создай аккаунт', 'Подбери 30-50 ключевых слов в Wordstat (wordstat.yandex.ru): введи тему → выбери релевантные → добавь минус-слова', 'Создай 2 кампании: поисковая + РСЯ (рекламная сеть)', 'Напиши 3 варианта объявлений на каждую группу: заголовок до 35 символов, текст до 81', 'Поставь UTM-метки через utmgen.ru: utm_source=yandex&utm_medium=cpc&utm_campaign=...', 'Установи бюджет: 5000-10000₽ тестовый период', 'Через 7 дней: отключи ключи с CTR < 1%, усиль объявления с CTR > 5%', 'Через 14 дней: зафиксируй CPL и количество лидов'] },
      { name: 'Настройка сквозной аналитики', desc: 'Связать рекламу → сайт → CRM → деньги', steps: ['Установи Яндекс Метрику на сайт (metrika.yandex.ru)', 'Настрой цели: кнопка, форма, страница thank-you', 'Включи электронную коммерцию если есть оплата', 'Свяжи Метрику с Директом: Настройки → Связанные аккаунты', 'Настрой UTM-разметку для всех каналов', 'Создай дашборд: трафик по каналам → конверсии → CPL → ROI'] },
      { name: 'A/B тест лендинга', desc: 'Проверить какой вариант конвертирует лучше', steps: ['Определи что тестируешь: заголовок, CTA, форма, структура', 'Создай вариант B (меняй только 1 элемент за тест)', 'Настрой сплит в Google Optimize или VWO', 'Направь минимум 200 визитов на каждый вариант', 'Дождись stat sig (p < 0.05), обычно 2-4 недели', 'Задокументируй результат: что тестили, что получили, какой вывод'] },
    ],

    tools: [
      { name: 'Яндекс Директ', url: 'https://direct.yandex.ru', desc: 'Запуск контекстной рекламы в поиске и РСЯ', type: 'ads' },
      { name: 'Яндекс Метрика', url: 'https://metrika.yandex.ru', desc: 'Аналитика сайта: визиты, цели, вебвизор', type: 'analytics' },
      { name: 'Яндекс Wordstat', url: 'https://wordstat.yandex.ru', desc: 'Подбор ключевых слов с частотностью', type: 'research' },
      { name: 'Google Ads', url: 'https://ads.google.com', desc: 'Контекстная и медийная реклама Google', type: 'ads' },
      { name: 'Meta Ads Manager', url: 'https://business.facebook.com', desc: 'Таргетированная реклама в Facebook и Instagram', type: 'ads' },
      { name: 'UTM Generator', url: 'https://utmgen.ru', desc: 'Генератор UTM-меток за 30 секунд', type: 'tool' },
      { name: 'Google Optimize', url: 'https://optimize.google.com', desc: 'A/B тестирование страниц', type: 'testing' },
      { name: 'Roistat', url: 'https://roistat.com', desc: 'Сквозная аналитика: от клика до продажи', type: 'analytics' },
    ],

    metrics: ['CTR', 'CPC', 'CPL (Cost per Lead)', 'CAC', 'ROAS', 'ROI', 'Conversion Rate', 'LTV', 'LTV/CAC', 'Bounce Rate', 'CPM', 'CPA'],

    task_templates: [
      { title: 'Запустить первую рекламную кампанию и получить лиды', goal: 'Получить минимум 5 лидов с рекламного бюджета 5000₽', tags: ['ads', 'practice'], detailed_steps: ['Зарегистрируйся на direct.yandex.ru', 'Подбери 20 ключевых слов в Wordstat', 'Напиши 3 варианта объявлений', 'Поставь UTM-метки', 'Запусти кампанию с бюджетом 500₽/день', 'Через неделю: отключи нерабочие ключи, оптимизируй', 'Зафиксируй: потрачено, кликов, лидов, CPL'], metrics: ['Бюджет потрачен', 'Количество лидов', 'CPL', 'CTR объявлений'] },
    ]
  },

  ai_vibecoding: {
    name: 'AI / Vibecoding / No-code',
    keywords: ['ai', 'vibecoding', 'no-code', 'nocode', 'вайбкодинг', 'нейросети', 'автоматизация', 'low-code', 'prompt engineering', 'claude', 'gpt', 'cursor'],

    frameworks: [
      { name: 'AI-first Product Development', desc: 'Строить продукт начиная с AI-возможностей, а не UI', how: 'Сначала определи что AI может делать лучше человека в твоей области → построй MVP вокруг этого' },
      { name: 'Prompt Engineering Framework', desc: 'Role → Context → Task → Format → Constraints', how: 'Для каждого AI-вызова: определи роль модели, дай контекст, опиши задачу, укажи формат ответа, добавь ограничения' },
      { name: 'RAG (Retrieval Augmented Generation)', desc: 'AI отвечает на основе твоих данных, а не общих знаний', how: 'Загрузи свою базу знаний → при запросе найди релевантные куски → подставь в промпт → получи точный ответ' },
      { name: 'Build in Public', desc: 'Строй продукт публично: показывай процесс, собирай фидбек', how: 'Каждую неделю публикуй: что сделал, что узнал, что планирую. Twitter/Telegram/LinkedIn.' },
    ],

    methodologies: [
      { name: 'Создание AI-приложения через vibecoding', desc: 'Полный цикл от идеи до деплоя без написания кода руками', steps: ['Опиши идею в свободной форме: что делает приложение, для кого, какая проблема', 'Открой Claude / Cursor / Bolt.new → опиши проект в промпте', 'Получи первую версию, протестируй локально', 'Итерируй: скажи AI что не работает / что добавить, получи исправления', 'Задеплой на Vercel / Netlify / Cloudflare Pages', 'Покажи 5 людям, собери фидбек, вернись к шагу 4'] },
      { name: 'Автоматизация рабочих процессов через AI', desc: 'Заменить ручную рутину на AI-пайплайн', steps: ['Запиши все повторяющиеся задачи за неделю', 'Для каждой оцени: можно ли автоматизировать? Сколько времени тратится?', 'Выбери топ-3 по времени', 'Для каждой: напиши промпт/workflow в Claude / Make.com / Zapier', 'Протестируй на реальных данных', 'Измерь: сколько времени экономишь в неделю'] },
      { name: 'Создание MCP-сервера', desc: 'Расширение возможностей Claude через Model Context Protocol', steps: ['Определи какие данные/API ты хочешь подключить к Claude', 'Изучи документацию MCP: modelcontextprotocol.io', 'Используй Claude для генерации кода MCP-сервера', 'Подключи к Claude Desktop через конфиг', 'Протестируй: Claude теперь имеет доступ к твоим данным'] },
    ],

    tools: [
      { name: 'Claude (Anthropic)', url: 'https://claude.ai', desc: 'Лучший для кодинга, анализа, длинных текстов', type: 'ai' },
      { name: 'Cursor', url: 'https://cursor.com', desc: 'AI-powered IDE: пиши код через диалог с AI', type: 'ide' },
      { name: 'Bolt.new', url: 'https://bolt.new', desc: 'Генерация полных веб-приложений одним промптом', type: 'builder' },
      { name: 'v0.dev', url: 'https://v0.dev', desc: 'Генерация React UI компонентов через промпт', type: 'builder' },
      { name: 'Supabase', url: 'https://supabase.com', desc: 'Backend-as-a-Service: БД, авторизация, API, Edge Functions', type: 'backend' },
      { name: 'Vercel', url: 'https://vercel.com', desc: 'Деплой фронтенда в один клик из GitHub', type: 'deploy' },
      { name: 'Make.com', url: 'https://make.com', desc: 'Визуальная автоматизация: связывай сервисы без кода', type: 'automation' },
      { name: 'Zapier', url: 'https://zapier.com', desc: 'Простые автоматизации: если X → то Y', type: 'automation' },
      { name: 'Windsurf', url: 'https://windsurf.com', desc: 'AI IDE для full-stack разработки', type: 'ide' },
    ],

    metrics: ['Время от идеи до MVP', 'Количество задеплоенных проектов', 'Количество юзеров', 'Время сэкономленное автоматизацией', 'Стоимость API на 1 юзера'],

    task_templates: [
      { title: 'Создать и задеплоить AI-приложение за выходные', goal: 'Полный цикл: идея → промпт → код → деплой → первые юзеры', tags: ['vibecoding', 'practice'], detailed_steps: ['Суббота утро: опиши идею (30 мин). Какая проблема? Для кого? Что приложение делает?', 'Суббота день: открой Claude → опиши проект → получи код (2-3 часа итераций)', 'Суббота вечер: протестируй локально, исправь баги через Claude', 'Воскресенье утро: залей на GitHub → задеплой на Vercel (30 мин)', 'Воскресенье день: покажи 5 людям, собери фидбек (1-2 часа)', 'Воскресенье вечер: запиши что получилось, что нет, план на следующие выходные'], metrics: ['Приложение задеплоено (да/нет)', 'Количество юзеров которые попробовали', 'Количество полученных фидбеков'] },
    ]
  },

  content_marketing: {
    name: 'Контент-маркетинг / SMM',
    keywords: ['контент', 'smm', 'копирайтинг', 'контент-маркетинг', 'соцсети', 'блог', 'telegram', 'instagram', 'youtube', 'tiktok', 'vc.ru', 'reels'],

    frameworks: [
      { name: 'Content Pillars', desc: '3-5 ключевых тем для всего контента', how: 'Определи 3-5 столпов: например [экспертиза, закулисье, кейсы, мемы, мотивация]. Каждый пост = один столп' },
      { name: 'Hero-Hub-Hygiene', desc: '3 типа контента: вирусный, регулярный, SEO-evergreen', how: 'Hero = 1 раз/мес (большой материал), Hub = 2 раза/нед (регулярные посты), Hygiene = SEO-статьи (вечнозелёные)' },
      { name: 'AIDA для копирайтинга', desc: 'Attention → Interest → Desire → Action', how: 'Заголовок = Attention, первый абзац = Interest, выгоды = Desire, CTA = Action' },
      { name: 'Контент-календарь', desc: 'Планирование контента на месяц вперёд', how: 'Notion/Google Sheets: дата, платформа, тип (pillar), тема, статус (идея/черновик/опубликован), метрики' },
    ],

    methodologies: [
      { name: 'Запуск Telegram-канала с нуля', desc: 'От 0 до первых 100 подписчиков', steps: ['Определи нишу и позиционирование: "Канал про [тема] для [ЦА]"', 'Создай канал: аватарка, описание (2 предложения), закреплённый пост "О чём канал"', 'Напиши 10 постов заранее: 5 экспертных + 3 закулисье + 2 кейса', 'Публикуй 5 дней подряд, потом 3 раза/неделю', 'Продвижение: взаимный пиар, комментинг, посты в чатах, публикация на VC.ru', 'Через 30 дней: посмотри статистику, какие посты зашли (ERR > 15%)'] },
      { name: 'Написание статьи для VC.ru', desc: 'От идеи до публикации с охватом 1000+', steps: ['Выбери тему: что волнует аудиторию? Проверь через vc.ru/popular', 'Структура: заголовок (5 вариантов) → лид (2 предложения) → тезисы → CTA', 'Напиши черновик за 1 час, не редактируй пока пишешь', 'Редактура: убери воду, добавь цифры, разбей на абзацы, добавь картинки', 'Опубликуй, отправь ссылку в 3-5 профильных чатов', 'Через 48 часов: зафиксируй просмотры, комментарии, переходы'] },
    ],

    tools: [
      { name: 'Telegram', url: 'https://telegram.org', desc: 'Мессенджер и платформа для каналов/ботов', type: 'platform' },
      { name: 'VC.ru', url: 'https://vc.ru', desc: 'Платформа для публикации экспертных статей', type: 'platform' },
      { name: 'Canva', url: 'https://canva.com', desc: 'Дизайн графики для соцсетей', type: 'design' },
      { name: 'TGStat', url: 'https://tgstat.ru', desc: 'Аналитика Telegram-каналов: охваты, ERR, рост', type: 'analytics' },
      { name: 'LiveDune', url: 'https://livedune.ru', desc: 'Аналитика Instagram/VK/Telegram', type: 'analytics' },
      { name: 'Notion AI', url: 'https://notion.so', desc: 'Генерация черновиков, планирование контента', type: 'ai' },
      { name: 'CapCut', url: 'https://capcut.com', desc: 'Бесплатный видеоредактор для Reels/TikTok', type: 'video' },
    ],

    metrics: ['ERR (Engagement Rate per Reach)', 'Охват поста', 'Подписчики (рост/мес)', 'Переходы по ссылкам', 'Просмотры статей', 'Комментарии', 'Shares/Reposts', 'CPF (Cost per Follower)'],

    task_templates: [
      { title: 'Запустить контент-стратегию на месяц', goal: 'Создать контент-план и опубликовать 12 постов за месяц', tags: ['content', 'practice'], detailed_steps: ['Определи 3 Content Pillars для своего канала/блога', 'Составь контент-календарь в Notion: 3 поста/неделю × 4 недели = 12 постов', 'Распредели по pillars: 4 экспертных + 4 кейса + 4 закулисье', 'Напиши 4 поста заранее (batch writing — один день на всё)', 'Публикуй по расписанию: Пн/Ср/Пт в 10:00', 'Через месяц: какие посты набрали ERR > 15%? Делай больше таких'], metrics: ['Количество опубликованных постов', 'Средний ERR', 'Рост подписчиков за месяц', 'Лучший пост по охвату'] },
    ]
  },

  data_analytics: {
    name: 'Аналитика данных',
    keywords: ['аналитик', 'аналитика', 'data', 'analyst', 'bi', 'sql', 'tableau', 'python', 'дата', 'данные', 'dashboard', 'дашборд', 'отчёт'],

    frameworks: [
      { name: 'CRISP-DM', desc: 'Стандартный процесс аналитического проекта: Business Understanding → Data Understanding → Preparation → Modeling → Evaluation → Deployment', how: 'Для каждого аналитического проекта пройди 6 этапов по чек-листу' },
      { name: 'Pyramid Principle', desc: 'Структура аналитического отчёта: вывод сверху, аргументы ниже, данные внизу', how: 'Начни с 1 главного вывода, потом 3 аргумента, потом данные под каждый аргумент' },
      { name: 'Hypothesis-Driven Analysis', desc: 'Не "посмотрим что в данных", а "проверим конкретную гипотезу"', how: 'Перед началом: запиши 3 гипотезы. Анализ = проверка каждой. В конце: подтверждена/опровергнута' },
    ],

    methodologies: [
      { name: 'SQL-анализ данных', desc: 'От вопроса бизнеса до ответа в SQL', steps: ['Сформулируй бизнес-вопрос: "Почему упала конверсия в марте?"', 'Определи какие данные нужны: таблицы, поля, период', 'Напиши SQL: SELECT, JOIN, WHERE, GROUP BY, HAVING', 'Проверь результат: количество строк, NULL-ы, выбросы', 'Визуализируй: Google Sheets/Tableau/Metabase', 'Сформулируй вывод: 1 предложение + 1 рекомендация'] },
      { name: 'Построение дашборда', desc: 'От метрик до интерактивного отчёта', steps: ['Определи аудиторию дашборда: CEO, маркетинг, продукт?', 'Выбери 5-7 ключевых метрик (не больше!)', 'Нарисуй макет на бумаге: что где, какой тип графика', 'Подключи данные: SQL → Google Sheets / Metabase / DataLens', 'Настрой фильтры: период, сегмент, канал', 'Покажи стейкхолдеру, собери фидбек, доработай'] },
    ],

    tools: [
      { name: 'SQL (PostgreSQL)', url: 'https://www.postgresql.org', desc: 'Язык запросов к базам данных', type: 'language' },
      { name: 'Google Sheets', url: 'https://sheets.google.com', desc: 'Таблицы: быстрый анализ, графики, pivot tables', type: 'spreadsheet' },
      { name: 'Metabase', url: 'https://metabase.com', desc: 'Open-source BI: SQL-запросы → дашборды за минуты', type: 'bi' },
      { name: 'Yandex DataLens', url: 'https://datalens.yandex.ru', desc: 'Бесплатная BI-система от Яндекса', type: 'bi' },
      { name: 'Tableau Public', url: 'https://public.tableau.com', desc: 'Визуализация данных: бесплатная версия Tableau', type: 'bi' },
      { name: 'Python + Pandas', url: 'https://pandas.pydata.org', desc: 'Анализ данных на Python', type: 'language' },
      { name: 'Jupyter Notebook', url: 'https://jupyter.org', desc: 'Интерактивная среда для аналитики на Python', type: 'ide' },
    ],

    metrics: ['Конверсия по воронке', 'Retention по когортам', 'ARPU/ARPPU', 'Revenue по сегментам', 'Churn Rate', 'LTV', 'Сезонность', 'Корреляция метрик'],

    task_templates: [
      { title: 'Построить дашборд ключевых метрик продукта', goal: 'Создать дашборд с 5 метриками для еженедельного обсуждения', tags: ['analytics', 'practice'], detailed_steps: ['Определи 5 метрик: DAU, конверсия, retention D7, ARPU, NPS', 'Подготовь данные: SQL-запрос для каждой метрики', 'Выбери инструмент: Metabase (бесплатный) или DataLens', 'Создай 5 графиков: линейный для трендов, bar для сравнений', 'Добавь фильтры: период, платформа, сегмент', 'Настрой автообновление (ежедневно)', 'Поделись ссылкой с командой, собери фидбек'], metrics: ['Дашборд создан и работает', 'Количество метрик на дашборде', 'Используется на еженедельных встречах (да/нет)'] },
    ]
  },

  sales_b2b: {
    name: 'Sales / B2B продажи',
    keywords: ['sales', 'продажи', 'b2b', 'сейлз', 'менеджер по продажам', 'account', 'бизнес-развитие', 'лиды', 'crm', 'холодные звонки', 'outbound'],

    frameworks: [
      { name: 'SPIN Selling', desc: 'Situation → Problem → Implication → Need-payoff: вопросы которые ведут к продаже', how: 'На следующем звонке задай по 2 вопроса каждого типа. Записывай ответы. Не продавай — слушай.' },
      { name: 'BANT', desc: 'Budget, Authority, Need, Timeline — квалификация лида', how: 'Для каждого лида определи: есть ли бюджет? Кто принимает решение? Есть ли реальная потребность? Когда планируют?' },
      { name: 'Challenger Sale', desc: 'Не подстраивайся под клиента — обучай его и бросай вызов', how: 'Подготовь 1 инсайт который клиент не знает о своей проблеме. Начни встречу с этого инсайта, а не с питча' },
      { name: 'MEDDPICC', desc: 'Metrics, Economic Buyer, Decision Criteria, Decision Process, Paper Process, Implications, Champion, Competition', how: 'Для каждой сделки >500к₽ заполни MEDDPICC-карточку в CRM: ответь на 8 вопросов' },
      { name: 'Value Selling', desc: 'Продавай ценность (ROI), а не фичи', how: 'Для каждого клиента рассчитай: "С нашим продуктом вы экономите/зарабатываете X₽ в месяц при стоимости Y₽"' },
    ],

    methodologies: [
      { name: 'Cold Outreach система', desc: 'Систематический cold email + LinkedIn', steps: ['Определи ICP (Ideal Customer Profile): индустрия, размер, роль, боль', 'Собери базу: 100 контактов через LinkedIn Sales Navigator / Apollo.io', 'Напиши 3 варианта cold email: персонализация + инсайт + CTA (не продажа, а звонок)', 'Настрой последовательность: письмо 1 → ждём 3 дня → follow-up → ждём 5 дней → последний', 'Отправь через Lemlist/Woodpecker/вручную', 'Отслеживай: open rate > 40%, reply rate > 5%, meeting rate > 2%'] },
      { name: 'Проведение Discovery Call', desc: 'Первый звонок: понять проблему, квалифицировать, запланировать следующий шаг', steps: ['Подготовка (10 мин): изучи компанию, LinkedIn ЛПР-а, их сайт', 'Начало (2 мин): представься, повтори зачем звонок, спроси "удобно ли сейчас?"', 'Discovery (15 мин): задай 5-7 открытых вопросов по SPIN', 'Резюме (3 мин): перескажи что понял, уточни', 'Next Step (2 мин): предложи конкретный следующий шаг + дату', 'После звонка: заполни CRM, отправь follow-up email за 2 часа'] },
    ],

    tools: [
      { name: 'AmoCRM', url: 'https://amocrm.ru', desc: 'CRM для B2B продаж: воронка, сделки, автоматизация', type: 'crm' },
      { name: 'Bitrix24', url: 'https://bitrix24.ru', desc: 'CRM + управление проектами + коммуникация', type: 'crm' },
      { name: 'LinkedIn Sales Navigator', url: 'https://business.linkedin.com/sales-solutions', desc: 'Поиск и outreach B2B-контактов', type: 'prospecting' },
      { name: 'Apollo.io', url: 'https://apollo.io', desc: 'База B2B-контактов + email outreach', type: 'prospecting' },
      { name: 'Calendly', url: 'https://calendly.com', desc: 'Планирование встреч без переписки', type: 'scheduling' },
      { name: 'Loom', url: 'https://loom.com', desc: 'Видеосообщения для персонализированного outreach', type: 'communication' },
    ],

    metrics: ['Количество лидов', 'Conversion rate по этапам воронки', 'Average Deal Size', 'Sales Cycle Length', 'Win Rate', 'Pipeline Coverage', 'MRR/ARR', 'Churn Rate', 'NRR (Net Revenue Retention)'],

    task_templates: [
      { title: 'Запустить cold outreach кампанию на 50 контактов', goal: 'Получить минимум 3 discovery call из 50 cold emails', tags: ['sales', 'outreach', 'practice'], detailed_steps: ['Определи ICP: индустрия, размер компании, роль ЛПР-а', 'Собери 50 контактов в Apollo.io или LinkedIn Sales Navigator', 'Напиши 3 варианта cold email (A/B тест темы и первого предложения)', 'Настрой 3-step sequence: письмо → follow-up через 3 дня → последний через 5 дней', 'Отправь по 10 писем/день (не всё сразу — спам-фильтры!)', 'Отслеживай метрики: opens > 40%, replies > 5%, meetings > 2%', 'После каждого ответа: персональный ответ в течение 2 часов'], metrics: ['Отправлено писем', 'Open Rate', 'Reply Rate', 'Количество запланированных встреч'] },
    ]
  }
};

// Утилита: найти подходящую сферу по ключевым словам
export function detectDomain(text) {
  const lower = (text || '').toLowerCase();
  const scores = {};

  for (const [key, domain] of Object.entries(KNOWLEDGE_BASE)) {
    let score = 0;
    for (const kw of domain.keywords) {
      if (lower.includes(kw.toLowerCase())) score++;
    }
    if (score > 0) scores[key] = score;
  }

  // Сортируем по количеству совпадений, возвращаем топ-3
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([key]) => key);
}

// Утилита: собрать контекст базы знаний для промпта
export function buildKnowledgeContext(domainKeys) {
  const parts = [];

  for (const key of domainKeys) {
    const domain = KNOWLEDGE_BASE[key];
    if (!domain) continue;

    parts.push(`\n=== СФЕРА: ${domain.name} ===`);

    parts.push('\nФреймворки:');
    for (const f of domain.frameworks) {
      parts.push(`- ${f.name}: ${f.desc}. Применение: ${f.how}`);
    }

    parts.push('\nМетодики:');
    for (const m of domain.methodologies) {
      parts.push(`- ${m.name}: ${m.desc}`);
      parts.push(`  Шаги: ${m.steps.join(' → ')}`);
    }

    parts.push('\nИнструменты:');
    for (const t of domain.tools) {
      parts.push(`- ${t.name} (${t.url}): ${t.desc}`);
    }

    parts.push('\nМетрики: ' + domain.metrics.join(', '));

    parts.push('\nШаблоны заданий:');
    for (const t of domain.task_templates) {
      parts.push(`- ${t.title}: ${t.goal}`);
      parts.push(`  Шаги: ${t.detailed_steps.join(' | ')}`);
      parts.push(`  Метрики: ${t.metrics.join(', ')}`);
    }
  }

  return parts.join('\n');
}
