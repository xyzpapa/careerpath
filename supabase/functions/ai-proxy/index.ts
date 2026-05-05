const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Task =
  | "career_analysis"
  | "achievement_line"
  | "task_map"
  | "interview_questions";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    const model = Deno.env.get("OPENAI_MODEL") || "gpt-5.5";

    if (!apiKey) {
      return json({ error: "OPENAI_API_KEY is not set in Supabase secrets" }, 500);
    }

    const body = await req.json().catch(() => null) as {
      task?: Task;
      input?: unknown;
      prompt?: string;
    } | null;

    if (!body) {
      return json({ error: "Empty request body" }, 400);
    }

    let prompt = "";

    if (body.prompt) {
      prompt = body.prompt;
    } else if (body.task && body.input) {
      prompt = buildPrompt(body.task, body.input);
    } else {
      return json({ error: "Expected { task, input } or { prompt }" }, 400);
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: prompt,
        max_output_tokens: body.task === "career_analysis" ? 3500 : 1200,
        text: {
          format: {
            type: "json_object",
          },
        },
      }),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      return json(
        {
          error: "OpenAI API error",
          status: response.status,
          details: payload,
        },
        response.status
      );
    }

    const raw =
  payload?.output_text ||
  extractOpenAIText(payload) ||
  "";

    if (!raw) {
      return json(
        {
          error: "OpenAI returned empty response",
          details: payload,
        },
        500
      );
    }

    const parsed = parseJson(raw);

    if (body.task) {
      return json(normalize(body.task, parsed), 200);
    }

    return json(parsed, 200);
  } catch (e) {
    return json(
      {
        error: "Proxy error",
        details: e instanceof Error ? e.message : String(e),
      },
      500
    );
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function extractOpenAIText(payload: any) {
  if (!Array.isArray(payload?.output)) return "";

  for (const item of payload.output) {
    if (!Array.isArray(item?.content)) continue;

    for (const content of item.content) {
      if (typeof content?.text === "string" && content.text.trim()) {
        return content.text;
      }

      if (typeof content?.value === "string" && content.value.trim()) {
        return content.value;
      }
    }
  }

  return "";
}

function parseJson(raw: string) {
  const cleaned = raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");

  if (first === -1 || last === -1) {
    throw new Error("AI returned non-JSON response");
  }

  return JSON.parse(cleaned.slice(first, last + 1));
}

function buildPrompt(task: Task, input: unknown) {
  const safeInput = JSON.stringify(input, null, 2).slice(0, 24000);

  const baseRules = `
Ты CareerPath AI: карьерный стратег, HR-партнёр и product/growth mentor.

Пиши по-русски.
Пиши конкретно, без воды.
Выводи ТОЛЬКО валидный JSON.
Не используй markdown.
Не используй хардкод Иван/GRUZAPP, если пользователь сам их не указал.
Не выдумывай реальные факты о кандидате.
Если данных мало — формулируй как план развития.
Все массивы должны быть заполнены.
Все URL должны начинаться с https://
`;

  if (task === "career_analysis") {
    return `${baseRules}

Входные данные пользователя:
${safeInput}

Сформируй JSON строго такой структуры:

{
  "analysis": {
    "summary": "2-3 предложения общего вывода",
    "gaps": [
      {
        "skill": "название навыка",
        "priority": "critical",
        "current_level": 20,
        "required_level": 80,
        "description": "зачем нужен навык и что именно подтянуть",
        "quick_win": "быстрое практическое действие",
        "resources": [
          {
            "title": "название ресурса",
            "url": "https://example.com",
            "type": "курс",
            "icon": "🎓"
          }
        ],
        "steps": [
          "практический шаг 1",
          "практический шаг 2"
        ]
      }
    ],
    "strengths": [
      "сильная сторона 1",
      "сильная сторона 2"
    ],
    "action_plan": "конкретный 90-дневный план"
  },
  "plan": [
    {
      "skill": "название навыка",
      "priority": "critical",
      "desc": "описание",
      "quick_win": "быстрое действие",
      "resources": [
        {
          "title": "название ресурса",
          "url": "https://example.com",
          "type": "курс",
          "icon": "🎓"
        }
      ],
      "steps": [
        "шаг 1",
        "шаг 2"
      ]
    }
  ],
  "taskMap": [
    {
      "id": "block_1",
      "title": "Блок 1: название блока",
      "tasks": [
        {
          "id": "task_1_1",
          "title": "название задачи",
          "goal": "цель задачи",
          "tags": ["AI", "practice"],
          "steps": [
            "шаг 1",
            "шаг 2"
          ],
          "tools": [
            {
              "name": "название инструмента",
              "url": "https://example.com",
              "description": "зачем нужен",
              "type": "tool",
              "icon": "🔧"
            }
          ],
          "metrics": [
            "результат",
            "артефакт"
          ]
        }
      ]
    }
  ],
  "interviewQuestions": [
    {
      "id": "q_1",
      "skill": "навык",
      "q": "вопрос",
      "tips": [
        "подсказка 1",
        "подсказка 2"
      ]
    }
  ]
}

Требования:
- 5-7 gaps.
- 5-7 пунктов plan.
- 3-4 блока taskMap.
- всего 6-10 задач в taskMap.
- 6-8 вопросов interviewQuestions.
- priority только: critical, important или nice.
- current_level и required_level только числа от 0 до 100.
`;
  }

  if (task === "task_map") {
    return `${baseRules}

Входные данные:
${safeInput}

Сгенерируй JSON:

{
  "taskMap": [
    {
      "id": "block_1",
      "title": "Блок 1: название блока",
      "tasks": [
        {
          "id": "task_1_1",
          "title": "название задачи",
          "goal": "цель",
          "tags": ["practice"],
          "steps": ["шаг 1", "шаг 2"],
          "tools": [
            {
              "name": "инструмент",
              "url": "https://example.com",
              "description": "описание",
              "type": "tool",
              "icon": "🔧"
            }
          ],
          "metrics": ["метрика 1", "метрика 2"]
        }
      ]
    }
  ]
}

Нужно 3-5 блоков и 8-12 задач.
`;
  }

  if (task === "interview_questions") {
    return `${baseRules}

Входные данные:
${safeInput}

Сгенерируй JSON:

{
  "interviewQuestions": [
    {
      "id": "q_1",
      "skill": "навык",
      "q": "вопрос",
      "tips": ["подсказка 1", "подсказка 2"]
    }
  ]
}

Нужно 8 вопросов: поведенческие, кейсовые, по метрикам, по стратегии и по слабым местам кандидата.
`;
  }

  return `${baseRules}

Входные данные:
${safeInput}

Сформулируй одну сильную строку достижения для резюме.

JSON:

{
  "line": "строка достижения"
}

Строка должна быть деловой, с действием, метрикой и периодом.
Без вранья.
`;
}

function normalize(task: Task, parsed: Record<string, unknown>) {
  if (task === "achievement_line") {
    return {
      line: String(parsed.line || "").trim(),
    };
  }

  if (task === "task_map") {
    return {
      taskMap: Array.isArray(parsed.taskMap) ? parsed.taskMap : [],
    };
  }

  if (task === "interview_questions") {
    return {
      interviewQuestions: Array.isArray(parsed.interviewQuestions)
        ? parsed.interviewQuestions
        : [],
    };
  }

  const analysis =
    parsed.analysis && typeof parsed.analysis === "object"
      ? parsed.analysis
      : {};

  return {
    analysis,
    plan: Array.isArray(parsed.plan) ? parsed.plan : [],
    taskMap: Array.isArray(parsed.taskMap) ? parsed.taskMap : [],
    interviewQuestions: Array.isArray(parsed.interviewQuestions)
      ? parsed.interviewQuestions
      : [],
  };
}