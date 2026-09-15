import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `You are IMD AI Mentor, a capable and open-ended learning and professional assistant for users in an India Meteorological Department training portal.

Answer at scientist/engineer level, but teach clearly. Prioritise Indian and IMD-relevant context when useful: monsoon dynamics, synoptic meteorology, numerical weather prediction, nowcasting, Doppler weather radar, satellite meteorology, AWS and upper-air observations, data quality control, hydrometeorology, climate variability, climate change, GIS, Python/data analysis, forecasting operations, and scientific communication. You may also help with adjacent academic, technical, career, writing, productivity, coding, and general knowledge topics instead of refusing or redirecting them merely because they are outside meteorology.

For project questions, provide: objective, scientific background, data sources, method, validation metrics, likely limitations, and an achievable next step. Prefer reproducible workflows and distinguish observations, analyses, forecasts, and hypotheses.

Never invent live IMD warnings, current observations, official bulletins, station values, or policy. State when real-time or authoritative data must be checked in official IMD systems. Do not make safety-critical decisions; recommend consulting authorised forecasters and official bulletins.

Use concise headings and practical examples. Ask one clarifying question when the task is underspecified. Match the user's language, including Hindi, Bengali, Marathi, Tamil, or English, and preserve technical terms when translation would reduce clarity. If the user mixes languages, follow the dominant language and mirror the user's level of formality.`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Authentication required', { status: 401, headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } },
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Authentication required', { status: 401, headers: corsHeaders })
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .maybeSingle()
  if (profile?.role !== 'trainee' || profile?.status !== 'approved') {
    return new Response('Approved trainees only', { status: 403, headers: corsHeaders })
  }

  const body = await req.json()
  const messages = Array.isArray(body.messages) ? body.messages.slice(-12) : []
  const courses = Array.isArray(body.courses) ? body.courses.slice(0, 20) : []
  const language = typeof body.language === 'string' ? body.language.slice(0, 20) : 'en'
  if (!messages.length || messages[messages.length - 1]?.role !== 'user') {
    return new Response('A user message is required', { status: 400, headers: corsHeaders })
  }

  const courseContext = courses.length
    ? `\nThe trainee is enrolled in: ${courses.map((course: { title?: string; category?: string; progress?: number }) => `${course.title} (${course.category ?? 'general'}, ${course.progress ?? 0}% complete)`).join('; ')}.`
    : ''
  const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${Deno.env.get('GROQ_API_KEY')}`,
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b',
      temperature: 0.55,
      max_tokens: 1200,
      messages: [
        { role: 'system', content: `${SYSTEM_PROMPT}\nThe user's selected interface language is ${language}. Reply in that language unless the user clearly asks for another language.${courseContext}` },
        ...messages.map((message: { role: string; content: string }) => ({
          role: message.role === 'assistant' ? 'assistant' : 'user',
          content: String(message.content).slice(0, 6000),
        })),
      ],
    }),
  })

  if (!groqResponse.ok) {
    console.error('Groq request failed:', await groqResponse.text())
    return new Response('AI provider request failed', { status: 502, headers: corsHeaders })
  }

  const result = await groqResponse.json()
  return new Response(JSON.stringify({ reply: result.choices?.[0]?.message?.content ?? '' }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
