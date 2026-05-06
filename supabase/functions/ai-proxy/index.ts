const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Task = "career_analysis" | "achievement_line" | "task_map" | "interview_questions";

const DEFAULT_MODEL = "anthropic/claude-haiku-4.5";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return json("ok", 200, true);
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) return json({ error: "OPENROUTER_API_KEY not set" }, 500);

    const body = await req.json().catch(() => null);
    if (!body?.task || !body.input) return json({ error: "Need { task, input }" }, 400);

    const task = body.task as Task;
    const model = Deno.env.get("OPENROUTER_MODEL") || DEFAULT_MODEL;

    if (task === "career_analysis") {
      // Разбиваем на 2 запроса чтобы модель не обрезала JSON
      const [part1, part2] = await Promise.all([
        callModel(apiKey, model, buildAnalysisPrompt(body.input), 3000),
        callModel(apiKey, model, buildTaskMapPrompt(body.input), 3000),
      ]);
      return json({
        analysis: part1.analysis || {},
        plan: Array.isArray(part1.plan) ? part1.plan : [],
        taskMap: Array.isArray(part2.taskMap) ? part2.taskMap : [],
        interviewQuestions: Array.isArray(part2.interviewQuestions) ? part2.interviewQuestions : [],
      });
    }

    if (task === "achievement_line") {
      const result = await callModel(apiKey, model, buildAchievementPrompt(body.input), 500);
      return json({ line: String(result.line || "").trim() });
    }

    if (task === "task_map") {
      const result = await callModel(apiKey, model, buildTaskMapPrompt(body.input), 3000);
      return json({ taskMap: Array.isArray(result.taskMap) ? result.taskMap : [] });
    }

    if (task === "interview_questions") {
      const result = await callModel(apiKey, model, buildInterviewPrompt(body.input), 2000);
      return json({ interviewQuestions: Array.isArray(result.interviewQuestions) ? result.interviewQuestions : [] });
    }

    return json({ error: `Unknown task: ${task}` }, 400);
  } catch (e) {
    console.error("Edge function error:", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

async function callModel(apiKey: string, model: string, prompt: string, maxTokens: number) {
  console.log(`[ai-proxy] calling model=${model} maxTokens=${maxTokens} promptLen=${prompt.length}`);

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "authorization": `Bearer ${apiKey}`,
      "http-referer": "https://careerpath-ecru.vercel.app",
      "x-title": "CareerPath AI",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const payload = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = payload?.error?.message || payload?.error || `OpenRouter ${res.status}`;
    console.error("[ai-proxy] OpenRouter error:", msg);
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }

  const raw = payload?.choices?.[0]?.message?.content || "";
  console.log(`[ai-proxy] got response, length=${raw.length}`);

  if (!raw) throw new Error("Empty response from model");
  return robustJsonParse(raw);
}

function robustJsonParse(raw: string) {
  // Очистка
  let s = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first === -1 || last === -1) throw new Error("No JSON object in response");
  s = s.slice(first, last + 1);

  // Попытка 1: как есть
  try { return JSON.parse(s); } catch (_) { /* продолжаем */ }

  // Попытка 2: чиним висячие запятые и кавычки
  try {
    const fixed = s
      .replace(/,(\s*[\]}])/g, "$1")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2018\u2019]/g, "'");
    return JSON.parse(fixed);
  } catch (_) { /* продолжаем */ }

  // Попытка 3: дополняем незакрытые скобки
  try {
    let result = s;
    const stack: string[] = [];
    let inStr = false, esc = false;
    for (let i = 0; i < result.length; i++) {
      const c = result[i];
      if (esc) { esc = false; continue; }
      if (inStr) { if (c === "\\") esc = true; else if (c === '"') inStr = false; continue; }
      if (c === '"') { inStr = true; continue; }
      if (c === "{" || c === "[") stack.push(c);
      else if (c === "}" || c === "]") { if (stack.length) stack.pop(); }
    }
    // Если в строке — обрубаем до последней кавычки
    if (inStr) {
      const lq = result.lastIndexOf('"');
      if (lq > 0) result = result.slice(0, lq + 1);
    }
    // Удаляем висячую запятую перед закрытием
    result = result.replace(/,\s*$/, "");
    // Закрываем
    while (stack.length) {
      const open = stack.pop();
      result += open === "{" ? "}" : "]";
    }
    return JSON.parse(result);
  } catch (e) {
    throw new Error(`Invalid JSON from model: ${(e as Error).message}`);
  }
}

function json(data: unknown, status = 200, raw = false) {
  const body = raw && typeof data === "string" ? data : JSON.stringify(data);
  return new Response(body, {
    status,
    headers: { ...corsHeaders, "content-type": "application/json; charset=utf-8" },
  });
}

// ===== ПРОМПТЫ =====

const RULES = `Ты CareerPath AI — карьерный стратег. Язык: русский. Формат: ТОЛЬКО валидный JSON, без markdown. Не выдумывай факты. Все URL начинаются с https://. Массивы не пустые.`;

function safeInput(input: unknown) {
  return JSON.stringify(input, null, 2).slice(0, 12000);
}

function buildAnalysisPrompt(input: unknown) {
  return `${RULES}

Данные: ${safeInput(input)}

Верни JSON:
{
  "analysis": {
    "summary": "2-3 предложения",
    "gaps": [{"skill":"...","priority":"critical|important|nice","current_level":20,"required_level":80,"description":"...","quick_win":"...","resources":[{"title":"...","url":"https://...","type":"курс","icon":"🎓"}],"steps":["шаг 1","шаг 2"]}],
    "strengths": ["сильная сторона 1","сторона 2"],
    "action_plan": "90-дневный план"
  },
  "plan": [{"skill":"...","priority":"critical","desc":"...","quick_win":"...","resources":[],"steps":[]}]
}

Нужно: 4-5 gaps, 4-5 пунктов plan. Коротко и конкретно.`;
}

function buildTaskMapPrompt(input: unknown) {
  return `${RULES}

Данные: ${safeInput(input)}

Верни JSON:
{
  "taskMap": [{"id":"block_1","title":"Блок 1: название","tasks":[{"id":"task_1_1","title":"задача","goal":"цель","tags":["practice"],"steps":["шаг"],"tools":[{"name":"инструмент","url":"https://...","description":"зачем","type":"tool","icon":"🔧"}],"metrics":["метрика"]}]}],
  "interviewQuestions": [{"id":"q_1","skill":"навык","q":"вопрос","tips":["подсказка"]}]
}

Нужно: 3 блока taskMap с 2-3 задачами каждый, 5 вопросов interviewQuestions. Коротко.`;
}

function buildInterviewPrompt(input: unknown) {
  return `${RULES}

Данные: ${safeInput(input)}

Верни JSON:
{"interviewQuestions":[{"id":"q_1","skill":"навык","q":"вопрос","tips":["подсказка 1"]}]}

Нужно 6 вопросов. Коротко.`;
}

function buildAchievementPrompt(input: unknown) {
  return `${RULES}

Данные: ${safeInput(input)}

Верни JSON:
{"line":"сильная строка достижения для резюме с метрикой и периодом"}`;
}
