import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import Shell from '../../components/Shell'
import { Badge, Button, Card, Input } from '../../components/ui'

const SUGGESTIONS = [
  'Explain how to interpret a skew-T log-P diagram for monsoon convection.',
  'Help me design a quality-control checklist for automatic weather station data.',
  'What is the difference between nowcasting, numerical weather prediction, and climate projection?',
  'Create a revision plan for synoptic meteorology and severe-weather warning operations.',
]

export default function ImdMentor() {
  const { profile } = useAuth()
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello ${profile?.full_name?.split(' ')[0] ?? 'there'}! I am your IMD AI Mentor. Ask me about meteorology, observations, forecasting workflows, climate science, data quality, or your Capacity Connect courses.`,
    },
  ])
  const [question, setQuestion] = useState('')
  const [courses, setCourses] = useState([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const endRef = useRef(null)

  useEffect(() => {
    supabase
      .from('enrollments')
      .select('status, progress, courses(title, category)')
      .eq('trainee_id', profile.id)
      .then(({ data }) => setCourses(data ?? []))
  }, [profile.id])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  async function ask(value = question) {
    const text = value.trim()
    if (!text || sending) return
    setQuestion('')
    setError('')
    const nextMessages = [...messages, { role: 'user', content: text }]
    setMessages(nextMessages)
    setSending(true)

    const { data, error: functionError } = await supabase.functions.invoke('imd-chat', {
      body: {
        messages: nextMessages.slice(-12),
        courses: courses.map((item) => ({
          title: item.courses?.title,
          category: item.courses?.category,
          status: item.status,
          progress: item.progress,
        })),
      },
    })

    setSending(false)
    if (functionError) {
      setError('The mentor is not available. Deploy the imd-chat Supabase Edge Function and configure GROQ_API_KEY.')
      return
    }
    setMessages((current) => [...current, { role: 'assistant', content: data?.reply ?? 'I could not generate a response.' }])
  }

  return (
    <Shell title="IMD AI mentor" subtitle="A project-oriented study companion for meteorology, observations, forecasting, and climate science.">
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <Card className="flex min-h-[620px] flex-col">
          <div className="mb-4 flex items-center justify-between border-b border-cloud-200 pb-4">
            <div>
              <p className="font-semibold text-navy-900">Ask the mentor</p>
              <p className="text-xs text-storm-500">Grounded in IMD workflows; verify operational decisions with authorised forecasters.</p>
            </div>
            <Badge tone="teal">IMD focus</Badge>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm ${
                  message.role === 'user' ? 'bg-navy-900 text-white' : 'bg-cloud-100 text-storm-700'
                }`}>
                  {message.content}
                </div>
              </div>
            ))}
            {sending && <div className="text-sm text-storm-500">The mentor is thinking…</div>}
            <div ref={endRef} />
          </div>

          {error && <p className="mt-4 rounded-md bg-coral-100 px-3 py-2 text-sm text-coral-600">{error}</p>}
          <form onSubmit={(event) => { event.preventDefault(); ask() }} className="mt-4 flex gap-2 border-t border-cloud-200 pt-4">
            <Input
              aria-label="Ask the IMD AI mentor"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask a meteorology or course question…"
              className="min-w-0 flex-1"
            />
            <Button type="submit" variant="accent" disabled={sending || !question.trim()}>Send</Button>
          </form>
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="font-semibold text-navy-900">Try asking</h2>
            <div className="mt-3 flex flex-col gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => ask(suggestion)}
                  className="focus-ring rounded-md border border-cloud-200 px-3 py-2 text-left text-sm text-storm-700 hover:bg-cloud-100"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </Card>
          <Card>
            <h2 className="font-semibold text-navy-900">Your learning context</h2>
            <p className="mt-1 text-xs text-storm-500">The mentor uses these enrolled courses to tailor explanations.</p>
            <div className="mt-3 space-y-2">
              {courses.length === 0 ? <p className="text-sm text-storm-500">No enrolled courses yet.</p> : courses.map((item) => (
                <div key={item.courses?.title} className="rounded-md bg-cloud-100 px-3 py-2 text-sm">
                  <p className="font-medium text-navy-900">{item.courses?.title}</p>
                  <p className="text-xs text-storm-500">{item.progress}% complete</p>
                </div>
              ))}
            </div>
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <h2 className="font-semibold text-navy-900">Good use cases</h2>
            <p className="mt-2 text-sm text-storm-500">
              Use it to turn an IMD project idea into a research question, explain radar or satellite products,
              review Python/data-analysis approaches, prepare a briefing, or practise an oral examination.
            </p>
          </Card>
        </div>
      </div>
    </Shell>
  )
}
