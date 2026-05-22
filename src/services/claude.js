const API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-6'

const DIALOGUE_SYSTEM = `あなたは「意思決定ログ」アプリのAIアシスタントです。
ユーザーが最近気になっていること、意識を向けていること、考えていることについて対話しながら深掘りしていきます。

あなたの役割：
- 温かく自然な質問でユーザーの思考を引き出す
- 「なぜそれが気になるのか」「どんな影響があるか」「どう感じているか」を丁寧に探る
- 背景・状況・感情・価値観を浮き彫りにする
- 一度に一つの質問だけをする（短く、具体的に）
- ユーザーの言葉を活かして反映させながら進める
- 押しつけがましくなく、コーチング的なアプローチで

注意：
- 常に日本語で返答する
- 応答は3〜5文程度に収める
- アドバイスや解決策は押しつけない（ユーザーが気づくよう導く）`

const SUMMARY_SYSTEM = `あなたは対話の内容を構造化してまとめるアシスタントです。
必ず以下のJSON形式のみで返してください（他のテキストは一切含めない）：
{
  "overview": "対話全体の要約（1〜2文）",
  "points": [
    {"topic": "トピック名（5〜10文字）", "understanding": "このトピックについての理解内容（1〜2文）"}
  ],
  "keywords": ["キーワード1", "キーワード2", "キーワード3"]
}`

const TRENDS_SYSTEM = `あなたは複数の意思決定ログを分析して傾向を抽出するアシスタントです。
必ず以下のJSON形式のみで返してください（他のテキストは一切含めない）：
{
  "currentTendencies": "現在の意識の傾向（2〜3文）",
  "recentFocus": "最近特に意識していること（1文）",
  "keyPoints": [
    {"point": "ポイント名（5〜15文字）", "understanding": "このポイントについての把握内容（1〜2文）"}
  ]
}`

async function callAPI(messages, systemPrompt, apiKey, onChunk) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      stream: !!onChunk,
      system: systemPrompt,
      messages,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `APIエラー: ${res.status}`)
  }

  if (!onChunk) {
    const data = await res.json()
    return data.content[0].text
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let full = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value)
    for (const line of chunk.split('\n')) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6)
      if (data === '[DONE]') continue
      try {
        const parsed = JSON.parse(data)
        if (parsed.type === 'content_block_delta') {
          const text = parsed.delta?.text || ''
          full += text
          onChunk(text, full)
        }
      } catch {}
    }
  }

  return full
}

export async function sendDialogueMessage(messages, apiKey, onChunk) {
  return callAPI(messages, DIALOGUE_SYSTEM, apiKey, onChunk)
}

export async function generateSummary(messages, apiKey) {
  const content = messages
    .map(m => `${m.role === 'user' ? 'ユーザー' : 'AI'}: ${m.content}`)
    .join('\n\n')

  const text = await callAPI(
    [{ role: 'user', content: `以下の対話をまとめてください：\n\n${content}` }],
    SUMMARY_SYSTEM,
    apiKey,
    null
  )

  try {
    return JSON.parse(text.trim())
  } catch {
    return { overview: text, points: [], keywords: [] }
  }
}

export async function generateTrends(sessions, apiKey) {
  const summarized = sessions
    .filter(s => s.summary)
    .slice(0, 20)
    .map(s => {
      const pts = s.summary.points.map(p => `・${p.topic}: ${p.understanding}`).join('\n')
      return `[${new Date(s.startedAt).toLocaleDateString('ja-JP')}]\n概要: ${s.summary.overview}\n${pts}`
    })
    .join('\n\n---\n\n')

  if (!summarized) throw new Error('まとめられたセッションがありません')

  const text = await callAPI(
    [{ role: 'user', content: `以下のログを分析して傾向をまとめてください：\n\n${summarized}` }],
    TRENDS_SYSTEM,
    apiKey,
    null
  )

  try {
    return JSON.parse(text.trim())
  } catch {
    return { currentTendencies: text, recentFocus: '', keyPoints: [] }
  }
}
