import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import Shell from '../../components/Shell'
import Loader from '../../components/Loader'
import EmptyState from '../../components/EmptyState'
import { Badge, Button, Card, Input, ProgressBar } from '../../components/ui'
import { getBestTrainer, matchCompetencyScore } from '../../lib/competencyMatcher'

export default function CompetencyMap() {
  const { profile, refreshProfile } = useAuth()
  const { translate } = useLanguage()
  const [competencies, setCompetencies] = useState((profile.skills ?? []).join(', '))
  const [courses, setCourses] = useState([])
  const [trainers, setTrainers] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    Promise.all([
      supabase.from('courses').select('*, profiles(full_name, skills, designation, bio)').eq('status', 'published'),
      supabase.from('profiles').select('id, full_name, skills, designation, bio').eq('role', 'trainer').eq('status', 'approved'),
      supabase.from('enrollments').select('course_id, progress, status').eq('trainee_id', profile.id),
    ]).then(([courseResult, trainerResult, enrollmentResult]) => {
      setCourses(courseResult.data ?? [])
      setTrainers(trainerResult.data ?? [])
      setEnrollments(enrollmentResult.data ?? [])
      setLoading(false)
    })
  }, [profile.id])

  const goalList = useMemo(() => competencies.split(',').map((item) => item.trim()).filter(Boolean), [competencies])
  const enrollmentByCourse = useMemo(() => new Map(enrollments.map((item) => [item.course_id, item])), [enrollments])
  const recommendations = useMemo(() => courses
    .map((course) => {
      const match = matchCompetencyScore(goalList, course)
      const bestTrainer = getBestTrainer(match.matched.length ? match.matched : goalList, trainers)
      return { course, ...match, bestTrainer, enrollment: enrollmentByCourse.get(course.id) }
    })
    .sort((a, b) => b.score - a.score), [courses, goalList, trainers, enrollmentByCourse])

  const mappedCompetencies = [...new Set(recommendations.flatMap((item) => item.matched))]
  const coverage = goalList.length ? Math.round((mappedCompetencies.length / goalList.length) * 100) : 0

  async function saveCompetencies(event) {
    event.preventDefault()
    setSaving(true)
    const skills = goalList
    await supabase.from('profiles').update({ skills }).eq('id', profile.id)
    await refreshProfile()
    setSaving(false)
    setSaved(true)
  }

  if (loading) return <Shell><Loader /></Shell>

  return (
    <Shell title="Competency Compass" subtitle="Turn your career goals into a personalised learning path and find the right expertise to guide you.">
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card className="border-l-4 border-l-teal-500">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-navy-900">Your competency goals</h2>
                <p className="mt-1 max-w-2xl text-sm text-storm-500">
                  Add the skills you want to build, separated by commas. Use specific terms such as radar,
                  Python, GIS, forecasting, climate data, or leadership.
                </p>
              </div>
              <Badge tone="teal">{coverage}% mapped</Badge>
            </div>
            <form onSubmit={saveCompetencies} className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Input
                aria-label="Competency goals"
                value={competencies}
                onChange={(event) => { setCompetencies(event.target.value); setSaved(false) }}
                placeholder="Radar, Python, GIS, Forecasting"
                className="min-w-0 flex-1"
              />
              <Button type="submit" variant="accent" disabled={saving}>{saving ? 'Saving…' : saved ? 'Saved ✓' : 'Update map'}</Button>
            </form>
          </Card>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-navy-900">Recommended learning path</h2>
              <span className="text-xs text-storm-500">{recommendations.length} published courses</span>
            </div>
            {recommendations.length === 0 ? (
              <EmptyState title="No published courses yet" hint="Once trainers publish courses, they will appear here and be matched to your goals." />
            ) : (
              <div className="flex flex-col gap-3">
                {recommendations.map(({ course, score, matched, bestTrainer, enrollment }) => (
                  <Card key={course.id} className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-navy-900">{course.title}</p>
                        <p className="mt-1 text-sm text-storm-500">{course.description}</p>
                      </div>
                      <Badge tone={score >= 50 ? 'teal' : 'amber'}>{score}% fit</Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {matched.length ? matched.map((item) => <Badge key={item} tone="teal">{item}</Badge>) : <span className="text-xs text-storm-500">Explore this course to discover a new competency.</span>}
                    </div>
                    {bestTrainer && (
                      <p className="text-xs text-storm-500">
                        Best expertise match: <span className="font-semibold text-navy-900">{bestTrainer.trainer.full_name}</span>
                        {bestTrainer.trainer.designation ? ` · ${bestTrainer.trainer.designation}` : ''}
                      </p>
                    )}
                    {enrollment && (
                      <div>
                        <div className="mb-1 flex justify-between text-xs font-semibold text-storm-500">
                          <span>{enrollment.status === 'completed' ? 'Completed' : 'Your progress'}</span><span>{enrollment.progress}%</span>
                        </div>
                        <ProgressBar value={enrollment.progress} />
                      </div>
                    )}
                    <Link to={`/trainee/courses/${course.id}`}><Button variant="outline">{enrollment ? 'Continue' : 'Explore course'}</Button></Link>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="font-semibold text-navy-900">Competency coverage</h2>
            <p className="mt-1 text-sm text-storm-500">Your map measures how many of your target competencies are covered by the current catalog.</p>
            <div className="mt-5 flex items-end gap-3">
              <span className="font-display text-4xl font-bold text-teal-600">{coverage}%</span>
              <span className="pb-1 text-xs text-storm-500">{mappedCompetencies.length} of {goalList.length || 0} goals matched</span>
            </div>
            <ProgressBar value={coverage} />
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <h2 className="font-semibold text-navy-900">Why this is useful</h2>
            <p className="mt-2 text-sm text-storm-500">
              Trainees get a clear route from capability gaps to courses. Trainers become discoverable through
              expertise, not just course ownership, making mentoring and course selection more intentional.
            </p>
          </Card>
        </div>
      </div>
    </Shell>
  )
}
