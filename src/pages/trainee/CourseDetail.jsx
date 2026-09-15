import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import Shell from '../../components/Shell'
import Loader from '../../components/Loader'
import EmptyState from '../../components/EmptyState'
import { Card, Badge, Button, ProgressBar, Textarea } from '../../components/ui'
import ProctoringGate from '../../components/ProctoringGate'

const TYPE_ICON = { video: '▶', pdf: '▤', slides: '▥', link: '⇢' }

async function sealCertificate(traineeId, courseId) {
  const payload = `${traineeId}:${courseId}:${Date.now()}`
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function QuizRunner({ quiz, questions, onFinished }) {
  // simple adaptive selection: start at difficulty 2, step up on correct / down on wrong
  const [pool] = useState(questions)
  const [difficulty, setDifficulty] = useState(2)
  const [asked, setAsked] = useState([])
  const [current, setCurrent] = useState(null)
  const [selected, setSelected] = useState(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [finished, setFinished] = useState(false)
  const MAX_QUESTIONS = Math.min(6, pool.length)

  const pickNext = (usedIds, targetDifficulty) => {
    const remaining = pool.filter((q) => !usedIds.includes(q.id))
    if (remaining.length === 0) return null
    const closest = [...remaining].sort((a, b) => Math.abs(a.difficulty - targetDifficulty) - Math.abs(b.difficulty - targetDifficulty))
    return closest[0]
  }

  useEffect(() => {
    setCurrent(pickNext([], difficulty))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAnswer = () => {
    if (selected === null) return
    const isCorrect = selected === current.correct_index
    const newAsked = [...asked, current.id]
    const newCorrect = correctCount + (isCorrect ? 1 : 0)
    setCorrectCount(newCorrect)
    setAsked(newAsked)

    if (newAsked.length >= MAX_QUESTIONS) {
      const percent = Math.round((newCorrect / newAsked.length) * 100)
      setFinished(true)
      onFinished(newCorrect, newAsked.length, percent)
      return
    }
    const nextDifficulty = Math.min(3, Math.max(1, difficulty + (isCorrect ? 1 : -1)))
    setDifficulty(nextDifficulty)
    setCurrent(pickNext(newAsked, nextDifficulty))
    setSelected(null)
  }

  if (finished || !current) return null

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-xs font-semibold text-storm-500">
        <span>Question {asked.length + 1} of {MAX_QUESTIONS}</span>
        <Badge tone="amber">Difficulty {current.difficulty}</Badge>
      </div>
      <p className="font-medium text-navy-900">{current.question}</p>
      <div className="flex flex-col gap-2">
        {current.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => setSelected(i)}
            className={`focus-ring rounded-md border px-3.5 py-2.5 text-left text-sm transition-colors ${
              selected === i ? 'border-teal-500 bg-teal-100 text-teal-600' : 'border-cloud-200 hover:bg-cloud-100'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      <Button variant="accent" disabled={selected === null} onClick={handleAnswer} className="w-full">
        {asked.length + 1 === MAX_QUESTIONS ? 'Submit test' : 'Next question'}
      </Button>
    </Card>
  )
}

export default function CourseDetail() {
  const { id } = useParams()
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [course, setCourse] = useState(null)
  const [materials, setMaterials] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [enrollment, setEnrollment] = useState(null)
  const [activeQuiz, setActiveQuiz] = useState(null)
  const [quizResult, setQuizResult] = useState(null)
  const [certificate, setCertificate] = useState(null)
  const [feedback, setFeedback] = useState({ rating: 5, comment: '' })
  const [feedbackSent, setFeedbackSent] = useState(false)

  const load = async () => {
    const [{ data: c }, { data: m }, { data: q }, { data: enr }, { data: cert }] = await Promise.all([
      supabase.from('courses').select('*, profiles(full_name)').eq('id', id).single(),
      supabase.from('course_materials').select('*').eq('course_id', id).order('created_at'),
      supabase.from('quizzes').select('*, quiz_questions(*)').eq('course_id', id),
      supabase.from('enrollments').select('*').eq('course_id', id).eq('trainee_id', profile.id).maybeSingle(),
      supabase.from('certificates').select('*').eq('course_id', id).eq('trainee_id', profile.id).maybeSingle(),
    ])
    setCourse(c)
    setMaterials(m ?? [])
    setQuizzes(q ?? [])
    setEnrollment(enr)
    setCertificate(cert)
    setLoading(false)
  }

  useEffect(() => { load() }, [id, profile.id])

  const handleEnroll = async () => {
    await supabase.from('enrollments').insert({ course_id: id, trainee_id: profile.id })
    load()
  }

  const handleQuizFinished = async (correct, total, percent) => {
    const passed = percent >= (activeQuiz.pass_percent ?? 60)
    setQuizResult({ correct, total, percent, passed })
    await supabase.from('quiz_attempts').insert({
      quiz_id: activeQuiz.id, trainee_id: profile.id, score: correct, total, passed,
    })
    if (passed) {
      const newProgress = Math.min(100, (enrollment?.progress ?? 0) + Math.round(100 / Math.max(1, quizzes.length)))
      const completed = newProgress >= 100
      await supabase.from('enrollments').update({
        progress: newProgress, status: completed ? 'completed' : 'in_progress',
      }).eq('id', enrollment.id)

      if (completed && !certificate) {
        const hash = await sealCertificate(profile.id, id)
        await supabase.from('certificates').insert({ trainee_id: profile.id, course_id: id, cert_hash: hash })
      }
      load()
    }
  }

  const submitFeedback = async () => {
    await supabase.from('feedback').insert({ course_id: id, trainee_id: profile.id, rating: feedback.rating, comment: feedback.comment })
    setFeedbackSent(true)
  }

  if (loading) return <Shell><Loader /></Shell>
  if (!course) return <Shell><EmptyState title="Course not found" /></Shell>

  return (
    <Shell title={course.title} subtitle={`Taught by ${course.profiles?.full_name ?? 'Unassigned'}`}>
      <Link to="/trainee/courses" className="mb-4 inline-block text-sm font-semibold text-teal-600 hover:underline">← Back to catalog</Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {course.category && <Badge>{course.category}</Badge>}
              {certificate && <Badge tone="teal">Certified ✓</Badge>}
            </div>
            <p className="text-sm text-storm-700">{course.description}</p>
            {!enrollment ? (
              <Button variant="accent" className="mt-4" onClick={handleEnroll}>Enroll in this course</Button>
            ) : (
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs font-semibold text-storm-500">
                  <span>Your progress</span><span>{enrollment.progress}%</span>
                </div>
                <ProgressBar value={enrollment.progress} />
              </div>
            )}
          </Card>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-navy-900">Learning material</h2>
            {materials.length === 0 ? (
              <EmptyState title="No material uploaded yet" hint="The trainer hasn't added materials for this course." />
            ) : (
              <div className="flex flex-col gap-2">
                {materials.map((m) => (
                  <a key={m.id} href={m.url} target="_blank" rel="noreferrer">
                    <Card className="flex items-center gap-3 hover:border-teal-500">
                      <span className="text-lg text-teal-600">{TYPE_ICON[m.type] ?? '⇢'}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-navy-900">{m.title}</p>
                        <p className="text-xs uppercase tracking-wide text-storm-300">{m.type}</p>
                      </div>
                    </Card>
                  </a>
                ))}
              </div>
            )}
          </div>

          {enrollment && (
            <div>
              <h2 className="mb-3 text-lg font-semibold text-navy-900">Tests</h2>
              {quizzes.length === 0 ? (
                <EmptyState title="No tests yet" hint="Tests will appear here once the trainer adds them." />
              ) : activeQuiz ? (
                <ProctoringGate title={activeQuiz.title} onExit={() => { setActiveQuiz(null); setQuizResult(null) }}>
                  {quizResult ? (
                    <Card className="flex flex-col items-center gap-2 py-8 text-center">
                      <p className={`font-display text-4xl font-bold ${quizResult.passed ? 'text-teal-600' : 'text-coral-600'}`}>{quizResult.percent}%</p>
                      <p className="text-sm text-storm-500">{quizResult.correct} of {quizResult.total} correct</p>
                      <Badge tone={quizResult.passed ? 'teal' : 'coral'}>{quizResult.passed ? 'Passed' : 'Not yet — try again later'}</Badge>
                      <p className="max-w-md text-sm text-storm-500">
                        {quizResult.passed
                          ? 'Great work — your answers show a solid grasp of this module.'
                          : 'Review the learning material, focus on the missed concepts, and try again when you are ready.'}
                      </p>
                      <Button variant="outline" className="mt-3" onClick={() => { setActiveQuiz(null); setQuizResult(null) }}>Back to tests</Button>
                    </Card>
                  ) : (
                    <QuizRunner quiz={activeQuiz} questions={activeQuiz.quiz_questions} onFinished={handleQuizFinished} />
                  )}
                </ProctoringGate>
              ) : (
                <div className="flex flex-col gap-2">
                  {quizzes.map((q) => (
                    <Card key={q.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-navy-900">{q.title}</p>
                        <p className="text-xs text-storm-500">
                          {q.quiz_questions?.length ?? 0} adaptive questions · pass at {q.pass_percent}%
                          {q.deadline ? ` · due ${new Date(q.deadline).toLocaleDateString()}` : ''}
                        </p>
                      </div>
                      <Button variant="accent" disabled={!q.quiz_questions?.length} onClick={() => setActiveQuiz(q)}>Start secure test</Button>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {enrollment?.status === 'completed' && !feedbackSent && (
            <Card>
              <h2 className="mb-3 text-lg font-semibold text-navy-900">Rate this course</h2>
              <div className="mb-3 flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setFeedback((f) => ({ ...f, rating: n }))} className="focus-ring text-2xl" aria-label={`${n} stars`}>
                    {n <= feedback.rating ? '★' : '☆'}
                  </button>
                ))}
              </div>
              <Textarea rows={3} placeholder="What did you think of this course?" value={feedback.comment} onChange={(e) => setFeedback((f) => ({ ...f, comment: e.target.value }))} className="w-full" />
              <Button variant="accent" className="mt-3" onClick={submitFeedback}>Submit feedback</Button>
            </Card>
          )}
        </div>

        <div>
          {certificate && (
            <Card className="border-teal-500/40 bg-teal-100/40">
              <p className="text-sm font-semibold text-teal-600">Certificate issued</p>
              <p className="mt-1 text-xs text-storm-500">Sealed {new Date(certificate.issued_at).toLocaleDateString()}</p>
              <p className="mt-2 break-all rounded-md bg-white px-2 py-1.5 font-mono text-[10px] text-storm-500">{certificate.cert_hash}</p>
              <Link to="/trainee/certificates" className="mt-3 inline-block text-sm font-semibold text-teal-600 hover:underline">View all certificates →</Link>
            </Card>
          )}
        </div>
      </div>
    </Shell>
  )
}
