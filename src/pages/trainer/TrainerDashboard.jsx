import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import Shell from '../../components/Shell'
import Loader from '../../components/Loader'
import EmptyState from '../../components/EmptyState'
import { Card, StatCard, Badge, Button } from '../../components/ui'

export default function TrainerDashboard() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState([])
  const [enrollCounts, setEnrollCounts] = useState({})
  const [attempts, setAttempts] = useState([])

  useEffect(() => {
    let active = true
    async function load() {
      const { data: c } = await supabase.from('courses').select('*').eq('trainer_id', profile.id).order('created_at', { ascending: false })
      const courseIds = (c ?? []).map((x) => x.id)
      let counts = {}
      let att = []
      if (courseIds.length) {
        const { data: e } = await supabase.from('enrollments').select('course_id').in('course_id', courseIds)
        counts = (e ?? []).reduce((acc, row) => ({ ...acc, [row.course_id]: (acc[row.course_id] ?? 0) + 1 }), {})
        const { data: quizzes } = await supabase.from('quizzes').select('id').in('course_id', courseIds)
        const quizIds = (quizzes ?? []).map((q) => q.id)
        if (quizIds.length) {
          const { data: a } = await supabase.from('quiz_attempts').select('passed').in('quiz_id', quizIds)
          att = a ?? []
        }
      }
      if (!active) return
      setCourses(c ?? [])
      setEnrollCounts(counts)
      setAttempts(att)
      setLoading(false)
    }
    load()
    return () => { active = false }
  }, [profile.id])

  if (loading) return <Shell><Loader /></Shell>

  const totalTrainees = Object.values(enrollCounts).reduce((a, b) => a + b, 0)
  const passRate = attempts.length ? Math.round((attempts.filter((a) => a.passed).length / attempts.length) * 100) : 0

  return (
    <Shell title={`Welcome, ${profile.full_name?.split(' ')[0]}`} subtitle="An overview of everything you're teaching.">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Courses" value={courses.length} accent="navy" />
        <StatCard label="Published" value={courses.filter((c) => c.status === 'published').length} accent="teal" />
        <StatCard label="Trainees enrolled" value={totalTrainees} accent="amber" />
        <StatCard label="Test pass rate" value={`${passRate}%`} accent="coral" />
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-navy-900">Your courses</h2>
          <Link to="/trainer/courses"><Button variant="accent">Manage courses</Button></Link>
        </div>

        {courses.length === 0 ? (
          <EmptyState title="No courses yet" hint="Create your first course to start uploading material and quizzes." action={<Link to="/trainer/courses"><Button variant="accent">Create a course</Button></Link>} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {courses.map((c) => (
              <Card key={c.id} className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-navy-900">{c.title}</p>
                  <Badge tone={c.status === 'published' ? 'teal' : 'amber'}>{c.status}</Badge>
                </div>
                <p className="text-sm text-storm-500">{enrollCounts[c.id] ?? 0} enrolled</p>
                <Link to={`/trainer/courses/${c.id}`}>
                  <Button variant="outline" className="w-full">Open</Button>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Shell>
  )
}
