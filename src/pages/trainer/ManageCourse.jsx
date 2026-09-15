import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import Shell from '../../components/Shell'
import Loader from '../../components/Loader'
import EmptyState from '../../components/EmptyState'
import { Card, Badge, Button, Input, Select, ProgressBar } from '../../components/ui'
import { matchCompetencyScore } from '../../lib/competencyMatcher'

const EMPTY_QUESTION = { question: '', options: ['', '', '', ''], correct_index: 0, difficulty: 2 }

export default function ManageCourse() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [course, setCourse] = useState(null)
  const [materials, setMaterials] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [attempts, setAttempts] = useState([])

  const [materialForm, setMaterialForm] = useState({ title: '', type: 'video', url: '' })
  const [quizTitle, setQuizTitle] = useState('')
  const [quizDeadline, setQuizDeadline] = useState('')
  const [activeQuizId, setActiveQuizId] = useState(null)
  const [question, setQuestion] = useState(EMPTY_QUESTION)

  const load = async () => {
    const [{ data: c }, { data: m }, { data: q }, { data: e }] = await Promise.all([
      supabase.from('courses').select('*').eq('id', id).single(),
      supabase.from('course_materials').select('*').eq('course_id', id).order('created_at'),
      supabase.from('quizzes').select('*, quiz_questions(*)').eq('course_id', id).order('created_at'),
      supabase.from('enrollments').select('*, profiles(full_name, skills)').eq('course_id', id).order('progress', { ascending: false }),
    ])
    const quizIds = (q ?? []).map((quiz) => quiz.id)
    const { data: a } = quizIds.length
      ? await supabase.from('quiz_attempts').select('quiz_id, trainee_id, score, total, passed, attempted_at').in('quiz_id', quizIds).order('attempted_at', { ascending: false })
      : { data: [] }
    setCourse(c)
    setMaterials(m ?? [])
    setQuizzes(q ?? [])
    setEnrollments(e ?? [])
    setAttempts(a ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const addMaterial = async (e) => {
    e.preventDefault()
    if (!materialForm.title || !materialForm.url) return
    await supabase.from('course_materials').insert({ ...materialForm, course_id: id })
    setMaterialForm({ title: '', type: 'video', url: '' })
    load()
  }

  const removeMaterial = async (materialId) => {
    await supabase.from('course_materials').delete().eq('id', materialId)
    load()
  }

  const createQuiz = async (e) => {
    e.preventDefault()
    if (!quizTitle) return
    await supabase.from('quizzes').insert({ course_id: id, title: quizTitle, deadline: quizDeadline || null })
    setQuizTitle(''); setQuizDeadline('')
    load()
  }

  const addQuestion = async (e) => {
    e.preventDefault()
    if (!question.question || question.options.some((o) => !o)) return
    await supabase.from('quiz_questions').insert({
      quiz_id: activeQuizId,
      question: question.question,
      options: question.options,
      correct_index: question.correct_index,
      difficulty: question.difficulty,
    })
    setQuestion(EMPTY_QUESTION)
    load()
  }

  if (loading) return <Shell><Loader /></Shell>
  if (!course) return <Shell><EmptyState title="Course not found" /></Shell>

  const competencyRows = enrollments.map((enrollment) => {
    const mapping = matchCompetencyScore(enrollment.profiles?.skills ?? [], course)
    const traineeAttempts = attempts.filter((attempt) => attempt.trainee_id === enrollment.trainee_id)
    const latest = traineeAttempts[0]
    return { enrollment, mapping, latest, attempts: traineeAttempts }
  })
  const traineeNames = new Map(enrollments.map((enrollment) => [enrollment.trainee_id, enrollment.profiles?.full_name]))
  const quizNames = new Map(quizzes.map((quiz) => [quiz.id, quiz.title]))

  return (
    <Shell title={course.title} subtitle="Add material, build quizzes, and track your trainees.">
      <Link to="/trainer/courses" className="mb-4 inline-block text-sm font-semibold text-teal-600 hover:underline">← Back to my courses</Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* materials */}
          <Card>
            <h2 className="mb-3 text-lg font-semibold text-navy-900">Learning material</h2>
            <form onSubmit={addMaterial} className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_120px] sm:items-end">
              <Input label="Title" value={materialForm.title} onChange={(e) => setMaterialForm((f) => ({ ...f, title: e.target.value }))} placeholder="Module 1 — Intro lecture" />
              <Select label="Type" value={materialForm.type} onChange={(e) => setMaterialForm((f) => ({ ...f, type: e.target.value }))}>
                <option value="video">Video</option>
                <option value="pdf">PDF</option>
                <option value="slides">Slides</option>
                <option value="link">Link</option>
              </Select>
              <Input label="URL" className="sm:col-span-2" value={materialForm.url} onChange={(e) => setMaterialForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://…" />
              <Button type="submit" variant="accent" className="sm:col-span-2 w-fit">Add material</Button>
            </form>
            <div className="flex flex-col gap-2">
              {materials.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-md border border-cloud-200 px-3 py-2 text-sm">
                  <span className="font-medium text-navy-900">{m.title} <span className="text-storm-300">· {m.type}</span></span>
                  <button onClick={() => removeMaterial(m.id)} className="focus-ring text-xs font-semibold text-coral-600">Remove</button>
                </div>
              ))}
            </div>
          </Card>

          {/* quizzes */}
          <Card>
            <h2 className="mb-3 text-lg font-semibold text-navy-900">Tests</h2>
            <form onSubmit={createQuiz} className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_180px_auto] sm:items-end">
              <Input label="Quiz title" value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} placeholder="Module 1 check" />
              <Input label="Deadline" type="date" value={quizDeadline} onChange={(e) => setQuizDeadline(e.target.value)} />
              <Button type="submit" variant="accent">Create quiz</Button>
            </form>

            <div className="flex flex-col gap-3">
              {quizzes.map((q) => (
                <div key={q.id} className="rounded-md border border-cloud-200 p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-navy-900">{q.title}</p>
                    <Badge>{q.quiz_questions?.length ?? 0} questions</Badge>
                  </div>
                  <button
                    onClick={() => setActiveQuizId(activeQuizId === q.id ? null : q.id)}
                    className="focus-ring mt-2 text-xs font-semibold text-teal-600"
                  >
                    {activeQuizId === q.id ? 'Hide question builder' : 'Add questions'}
                  </button>

                  {activeQuizId === q.id && (
                    <form onSubmit={addQuestion} className="mt-3 flex flex-col gap-2 border-t border-cloud-200 pt-3">
                      <Input label="Question" value={question.question} onChange={(e) => setQuestion((s) => ({ ...s, question: e.target.value }))} />
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {question.options.map((opt, i) => (
                          <Input
                            key={i}
                            label={`Option ${i + 1}${question.correct_index === i ? ' (correct)' : ''}`}
                            value={opt}
                            onChange={(e) => {
                              const options = [...question.options]; options[i] = e.target.value
                              setQuestion((s) => ({ ...s, options }))
                            }}
                          />
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Select label="Correct option" value={question.correct_index} onChange={(e) => setQuestion((s) => ({ ...s, correct_index: Number(e.target.value) }))}>
                          {question.options.map((_, i) => <option key={i} value={i}>Option {i + 1}</option>)}
                        </Select>
                        <Select label="Difficulty" value={question.difficulty} onChange={(e) => setQuestion((s) => ({ ...s, difficulty: Number(e.target.value) }))}>
                          <option value={1}>Easy</option>
                          <option value={2}>Medium</option>
                          <option value={3}>Hard</option>
                        </Select>
                      </div>
                      <Button type="submit" variant="accent" className="w-fit">Add question</Button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* trainees */}
        <div>
          <h2 className="mb-3 text-lg font-semibold text-navy-900">Trainee competency map</h2>
          <p className="mb-3 text-sm text-storm-500">Compare each trainee&apos;s declared skills with this course and review their latest test result.</p>
          {enrollments.length === 0 ? (
            <EmptyState title="No trainees yet" />
          ) : (
            <div className="flex flex-col gap-3">
              {competencyRows.map(({ enrollment: e, mapping, latest, attempts: traineeAttempts }) => (
                <Card key={e.id} className="flex flex-col gap-3 transition-transform hover:-translate-y-0.5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-navy-900">{e.profiles?.full_name}</p>
                    <Badge tone={e.status === 'completed' ? 'teal' : 'amber'}>{e.status.replace('_', ' ')}</Badge>
                  </div>
                  <ProgressBar value={e.progress} />
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-md bg-cloud-100 p-2">
                      <span className="block text-storm-500">Competency match</span>
                      <strong className="text-teal-600">{mapping.score}%</strong>
                    </div>
                    <div className="rounded-md bg-cloud-100 p-2">
                      <span className="block text-storm-500">Latest result</span>
                      <strong className={latest?.passed ? 'text-teal-600' : 'text-navy-900'}>
                        {latest ? `${Math.round((latest.score / Math.max(1, latest.total)) * 100)}%` : 'Not attempted'}
                      </strong>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {mapping.matched.length
                      ? mapping.matched.slice(0, 4).map((skill) => <Badge key={skill} tone="teal">{skill}</Badge>)
                      : <span className="text-xs text-storm-500">No matching skills declared yet.</span>}
                    {traineeAttempts.length > 1 && <span className="text-xs text-storm-500">{traineeAttempts.length} attempts</span>}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Card className="mt-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-navy-900">Results sheet</h2>
            <p className="mt-1 text-sm text-storm-500">A chronological record of every submitted test attempt for this course.</p>
          </div>
          <Badge tone="teal">{attempts.length} attempts</Badge>
        </div>
        {attempts.length === 0 ? (
          <p className="rounded-md bg-cloud-100 px-3 py-4 text-sm text-storm-500">Results will appear here after trainees submit a test.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="border-b border-cloud-200 text-xs uppercase tracking-wide text-storm-500">
                <tr>
                  <th className="px-3 py-2 font-semibold">Trainee</th>
                  <th className="px-3 py-2 font-semibold">Test</th>
                  <th className="px-3 py-2 font-semibold">Score</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 font-semibold">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((attempt) => (
                  <tr key={attempt.id} className="border-b border-cloud-100 last:border-0">
                    <td className="px-3 py-3 font-medium text-navy-900">{traineeNames.get(attempt.trainee_id) ?? 'Trainee'}</td>
                    <td className="px-3 py-3 text-storm-500">{quizNames.get(attempt.quiz_id) ?? 'Test'}</td>
                    <td className="px-3 py-3 font-semibold text-navy-900">{attempt.score}/{attempt.total}</td>
                    <td className="px-3 py-3"><Badge tone={attempt.passed ? 'teal' : 'coral'}>{attempt.passed ? 'Passed' : 'Needs review'}</Badge></td>
                    <td className="px-3 py-3 text-storm-500">{new Date(attempt.attempted_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </Shell>
  )
}
