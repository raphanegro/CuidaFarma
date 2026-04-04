import Anthropic from '@anthropic-ai/sdk'

export type AIProvider = 'anthropic' | 'groq' | 'gemini'

export interface AIProviderConfig {
  provider: AIProvider
  model: string
  apiKey: string
}

export interface ModelOption {
  provider: AIProvider
  model: string
  label: string
  requiresKey: 'anthropic' | 'groq' | 'gemini'
}

export const MODEL_OPTIONS: ModelOption[] = [
  // Anthropic
  { provider: 'anthropic', model: 'claude-sonnet-4-6',  label: 'Claude Sonnet 4.6 (Anthropic)', requiresKey: 'anthropic' },
  { provider: 'anthropic', model: 'claude-opus-4-6',    label: 'Claude Opus 4.6 (Anthropic)',   requiresKey: 'anthropic' },
  // Groq
  { provider: 'groq', model: 'gemma2-9b-it',                label: 'Gemma 2 9B (Groq)',                requiresKey: 'groq' },
  { provider: 'groq', model: 'llama-3.3-70b-versatile',     label: 'LLaMA 3.3 70B (Groq)',             requiresKey: 'groq' },
  { provider: 'groq', model: 'llama-3.1-8b-instant',        label: 'LLaMA 3.1 8B Instant (Groq)',      requiresKey: 'groq' },
  { provider: 'groq', model: 'mixtral-8x7b-32768',          label: 'Mixtral 8x7B (Groq)',               requiresKey: 'groq' },
  // Gemini / Gemma via Google
  { provider: 'gemini', model: 'gemini-2.5-flash',   label: 'Gemini 2.5 Flash (Google)',  requiresKey: 'gemini' },
  { provider: 'gemini', model: 'gemini-2.5-pro',     label: 'Gemini 2.5 Pro (Google)',    requiresKey: 'gemini' },
  { provider: 'gemini', model: 'gemma-3-27b-it',     label: 'Gemma 3 27B (Google)',       requiresKey: 'gemini' },
  { provider: 'gemini', model: 'gemma-4-27b-it',     label: 'Gemma 4 27B (Google)',       requiresKey: 'gemini' },
  { provider: 'gemini', model: 'gemma-4-9b-it',      label: 'Gemma 4 9B (Google)',        requiresKey: 'gemini' },
]

export async function callAIProvider(
  config: AIProviderConfig,
  prompt: string,
  maxTokens = 1500,
): Promise<string> {
  switch (config.provider) {
    case 'anthropic':
      return callAnthropic(config.apiKey, config.model, prompt, maxTokens)
    case 'groq':
      return callGroq(config.apiKey, config.model, prompt, maxTokens)
    case 'gemini':
      return callGemini(config.apiKey, config.model, prompt, maxTokens)
    default:
      throw new Error(`Provider desconhecido: ${config.provider}`)
  }
}

async function callAnthropic(apiKey: string, model: string, prompt: string, maxTokens: number): Promise<string> {
  const client = new Anthropic({ apiKey })
  const message = await client.messages.create({
    model,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  })
  if (message.content[0].type !== 'text') throw new Error('Resposta inesperada da Anthropic')
  return message.content[0].text
}

async function callGroq(apiKey: string, model: string, prompt: string, maxTokens: number): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.3,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: { message?: string } })?.error?.message || `Groq API erro ${res.status}`)
  }

  const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> }
  return data.choices?.[0]?.message?.content ?? ''
}

async function callGemini(apiKey: string, model: string, prompt: string, maxTokens: number): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.3,
      },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: { message?: string } })?.error?.message || `Gemini API erro ${res.status}`)
  }

  const data = await res.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}
