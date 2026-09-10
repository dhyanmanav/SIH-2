import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import Shell from '../../components/Shell'
import Loader from '../../components/Loader'
import EmptyState from '../../components/EmptyState'
import { Card, Badge, Button, Input, Select } from '../../components/ui'

export default function CourseCatalog() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState([])
  const [enrolledIds, setEnrolledIds] = useState(new Set())
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [enrolling, setEnrolling] = useState(null)

  const load = async () => {
    const [{ data: c }, { data: e }] = await Promise.all([
      supabase.from('courses').select('*, profiles(full_name)').eq('status', 'published').order('created_at', { ascending: false }),
      supabase.from('enrollments').select('course_id').eq('trainee_id', profile.id),
    ])
    setCourses(c ?? [])
    setEnrolledIds(new Set((e ?? []).map((x) => x.course_id)))
    setLoading(false)
  }

  useEffect(() => { load() }, [profile.id])

  const categories = useMemo(() => ['all', ...new Set(courses.map((c) => c.category).filter(Boolean))], [courses])

  const filtered = courses.filter((c) => {
    const matchesQuery = c.title.toLowerCase().includes(query.toLowerCase())
    const matchesCategory = category === 'all' || c.category === category
    return matchesQuery && matchesCategory
  })

  const handleEnroll = async (courseId) => {
    setEnrolling(courseId)
    await supabase.from('enrollments').insert({ course_id: courseId, trainee_id: profile.id })
    await load()
    setEnrolling(null)
  }

  if (loading) return <Shell><Loader /></Shell>

  return (
    <Shell title="Course catalog" subtitle="Browse published courses and enroll.">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <Input placeholder="Search courses…" value={query} onChange={(e) => setQuery(e.target.value)} className="sm:max-w-xs" />
        <Select value={category} onChange={(e) => setCategory(e.target.value)} className="sm:max-w-[200px]">
          {categories.map((c) => <option key={c} value={c}>{c === 'all' ? 'All categories' : c}</option>)}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No courses found" hint="Try a different search term or category." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c.id} className="flex flex-col gap-3">
              <div className="h-2 w-10 rounded-full" style={{ background: c.cover_color || '#0F7173' }} />
              <div>
                <p className="font-semibold text-navy-900">{c.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-storm-500">{c.description}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-storm-500">
                {c.category && <Badge>{c.category}</Badge>}
                <span>by {c.profiles?.full_name ?? 'Unassigned'}</span>
              </div>
              <div className="mt-auto flex gap-2 pt-1">
                <Link to={`/trainee/courses/${c.id}`} className="flex-1">
                  <Button variant="outline" className="w-full">View</Button>
                </Link>
                {!enrolledIds.has(c.id) && (
                  <Button variant="accent" disabled={enrolling === c.id} onClick={() => handleEnroll(c.id)} className="flex-1">
                    {enrolling === c.id ? 'Enrolling…' : 'Enroll'}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </Shell>
  )
}
