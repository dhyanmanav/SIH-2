import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import Shell from '../../components/Shell'
import Loader from '../../components/Loader'
import EmptyState from '../../components/EmptyState'
import { Card, Badge, Button, Select } from '../../components/ui'

function matchScore(category, trainer) {
  if (!category) return 0
  const words = category.toLowerCase().split(/\s+/)
  const skills = (trainer.skills ?? []).map((s) => s.toLowerCase())
  return skills.filter((skill) => words.some((w) => skill.includes(w) || w.includes(skill))).length
}

export default function ManageCourses() {
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState([])
  const [trainers, setTrainers] = useState([])

  const load = async () => {
    const [{ data: c }, { data: t }] = await Promise.all([
      supabase.from('courses').select('*, profiles(full_name)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('role', 'trainer').eq('status', 'approved'),
    ])
    setCourses(c ?? [])
    setTrainers(t ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const assignTrainer = async (courseId, trainerId) => {
    await supabase.from('courses').update({ trainer_id: trainerId || null }).eq('id', courseId)
    load()
  }

  const suggestedFor = (course) =>
    [...trainers].sort((a, b) => matchScore(course.category, b) - matchScore(course.category, a)).slice(0, 3)
      .filter((t) => matchScore(course.category, t) > 0)

  if (loading) return <Shell><Loader /></Shell>

  return (
    <Shell title="Courses" subtitle="Every course across the organization, with AI-suggested trainer matches for unfilled ones.">
      {courses.length === 0 ? (
        <EmptyState title="No courses yet" hint="Trainers can create courses from their dashboard." />
      ) : (
        <div className="flex flex-col gap-4">
          {courses.map((c) => {
            const suggestions = !c.trainer_id ? suggestedFor(c) : []
            return (
              <Card key={c.id} className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-navy-900">{c.title}</p>
                    <p className="text-xs text-storm-500">{c.category || 'Uncategorized'} · {c.profiles?.full_name ?? 'Unassigned trainer'}</p>
                  </div>
                  <Badge tone={c.status === 'published' ? 'teal' : 'amber'}>{c.status}</Badge>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Select value={c.trainer_id ?? ''} onChange={(e) => assignTrainer(c.id, e.target.value)} className="!py-1.5 text-xs">
                    <option value="">Unassigned</option>
                    {trainers.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                  </Select>

                  {suggestions.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs text-storm-500">Suggested match:</span>
                      {suggestions.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => assignTrainer(c.id, t.id)}
                          className="focus-ring rounded-full bg-teal-100 px-2.5 py-1 text-xs font-medium text-teal-600 hover:bg-teal-500 hover:text-white"
                        >
                          {t.full_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </Shell>
  )
}
