// utils/aiClient.js
// Provider-agnostic wrapper around Groq / OpenRouter (both OpenAI-compatible /chat/completions APIs).
// Switch providers via AI_PROVIDER in .env without touching call sites.

import dotenv from "dotenv";
dotenv.config();

const PROVIDERS = {
  groq: {
    baseUrl: "https://api.groq.com/openai/v1/chat/completions",
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  },
  openrouter: {
    baseUrl: "https://openrouter.ai/api/v1/chat/completions",
    apiKey: process.env.OPENROUTER_API_KEY,
    model: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free",
  },
};

function getProvider() {
  const name = process.env.AI_PROVIDER || "groq";
  const cfg = PROVIDERS[name];
  if (!cfg) throw new Error(`Unknown AI_PROVIDER "${name}". Use "groq" or "openrouter".`);
  if (!cfg.apiKey) throw new Error(`Missing API key for provider "${name}". Set it in .env.`);
  return { name, ...cfg };
}

/**
 * Calls the configured AI provider's chat completion endpoint.
 * @param {Array<{role: string, content: string}>} messages
 * @param {{ json?: boolean, temperature?: number, maxTokens?: number }} opts
 * @returns {Promise<string>} raw text content of the model's reply
 */
export async function chatComplete(messages, opts = {}) {
  const { json = false, temperature = 0.4, maxTokens = 1200 } = opts;
  const provider = getProvider();

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${provider.apiKey}`,
  };
  // OpenRouter asks for these optional headers for attribution; harmless if omitted.
  if (provider.name === "openrouter") {
    headers["HTTP-Referer"] = "http://localhost:5173";
    headers["X-Title"] = "ResumeGPT Career Assistant";
  }

  const body = {
    model: provider.model,
    messages,
    temperature,
    max_tokens: maxTokens,
  };
  if (json) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(provider.baseUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`AI provider (${provider.name}) error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

/** Strips markdown code fences and parses JSON safely. */
export function parseJsonSafe(text) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error("Failed to parse AI response as JSON: " + e.message + "\nRaw: " + cleaned.slice(0, 500));
  }
}
