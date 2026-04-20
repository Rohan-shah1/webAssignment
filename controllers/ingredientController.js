const { GoogleGenerativeAI } = require('@google/generative-ai');

const MODEL_CANDIDATES = [
  process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
];

const safeJsonParse = (text) => {
  const trimmed = String(text || '').trim();
  const start = trimmed.indexOf('[');
  const end = trimmed.lastIndexOf(']');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Model did not return a JSON array');
  }
  return JSON.parse(trimmed.slice(start, end + 1));
};

const tryGroqParse = async ({ prompt, ingredients }) => {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return null;

  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${groqKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      messages: [
        { role: 'system', content: 'You are a strict JSON API. Return only JSON array.' },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq request failed: ${response.status}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content || '';
  const parsed = safeJsonParse(content);
  if (!Array.isArray(parsed)) return null;

  return parsed
    .filter((x) => x && typeof x === 'object')
    .map((x, idx) => {
      const name = typeof x.name === 'string' ? x.name.trim() : String(ingredients[idx] || '').trim();
      const quantityDisplay = typeof x.quantityDisplay === 'string' && x.quantityDisplay.trim()
        ? x.quantityDisplay.trim()
        : 'as needed';
      return {
        name,
        quantityDisplay,
        raw: ingredients[idx] || '',
      };
    });
};

// POST /api/ingredients/normalize
// Body: { ingredients: string[] | string, baseQty?: number, desiredQty?: number }
const normalizeIngredientsAi = async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(501).json({ message: 'GEMINI_API_KEY not configured' });
    }

    const { ingredients, baseQty = 1, desiredQty = 1 } = req.body || {};
    const list = Array.isArray(ingredients)
      ? ingredients
      : typeof ingredients === 'string'
        ? ingredients.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

    if (!list.length) return res.json({ items: [] });

    const genAI = new GoogleGenerativeAI(apiKey);

    const prompt = [
      'You are an expert cooking assistant.',
      'Return ONLY valid JSON (no markdown, no code fences).',
      'Input is an array of ingredient lines. Parse each into a clean ingredient table row.',
      'Scale from base quantity to desired quantity.',
      'For each line, return an object with:',
      '- name: ingredient name only (e.g., "chicken", "tomato", "salt")',
      '- quantityDisplay: human-readable quantity for DESIRED quantity (e.g., "1 kg", "50 g", "10 g / 2 tsp", "as needed")',
      'Rules:',
      '- Keep kitchen-friendly units where possible (kg, g, mg, L, ml, tsp, tbsp, cup, pcs).',
      '- If quantity is missing in source, use "as needed".',
      '- Keep name concise; exclude the quantity+unit from name.',
      '- Preserve alternate unit hints when useful (example: "10 g / 2 tsp").',
      `Base quantity: ${baseQty}`,
      `Desired quantity: ${desiredQty}`,
      '',
      `Ingredients: ${JSON.stringify(list)}`,
    ].join('\n');

    let parsed = null;
    let lastError = null;
    for (const modelName of MODEL_CANDIDATES) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const text = result?.response?.text?.() || '';
        parsed = safeJsonParse(text);
        if (parsed) break;
      } catch (err) {
        lastError = err;
      }
    }

    if (!parsed) {
      try {
        const groqItems = await tryGroqParse({ prompt, ingredients: list });
        if (groqItems && groqItems.length) {
          return res.json({ items: groqItems, provider: 'groq' });
        }
      } catch (groqError) {
        lastError = groqError;
      }
    }

    if (!parsed) {
      const msg = lastError?.message || 'AI ingredient parsing failed';
      const quotaExceeded = /429|quota|rate limit/i.test(msg);
      return res.status(quotaExceeded ? 429 : 500).json({
        message: quotaExceeded
          ? 'Gemini quota exceeded and Groq fallback unavailable. Please try again later.'
          : 'AI could not parse ingredients right now.',
      });
    }

    const items = parsed
      .filter((x) => x && typeof x === 'object')
      .map((x, idx) => {
        const name = typeof x.name === 'string' ? x.name.trim() : String(list[idx] || '').trim();
        const quantityDisplay = typeof x.quantityDisplay === 'string' && x.quantityDisplay.trim()
          ? x.quantityDisplay.trim()
          : 'as needed';

        return {
          name,
          quantityDisplay,
          raw: list[idx] || '',
        };
      });

    return res.json({ items, provider: 'gemini' });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Ingredient normalization failed' });
  }
};

module.exports = { normalizeIngredientsAi };
