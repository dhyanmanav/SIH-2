import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import Shell from '../../components/Shell'
import Loader from '../../components/Loader'
import EmptyState from '../../components/EmptyState'
import { Card, StatCard, ProgressBar, Badge, Button } from '../../components/ui'

export default function TraineeDashboard() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [enrollments, setEnrollments] = useState([])
  const [certCount, setCertCount] = useState(0)
  const [announcements, setAnnouncements] = useState([])

  useEffect(() => {
    let active = true
    async function load() {
      const [{ data: enr }, { count: certs }, { data: ann }] = await Promise.all([
        supabase
          .from('enrollments')
          .select('*, courses(id, title, category, cover_color)')
          .eq('trainee_id', profile.id)
          .order('enrolled_at', { ascending: false }),
        supabase.from('certificates').select('*', { count: 'exact', head: true }).eq('trainee_id', profile.id),
        supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(3),
      ])
      if (!active) return
      setEnrollments(enr ?? [])
      setCertCount(certs ?? 0)
      setAnnouncements(ann ?? [])
      setLoading(false)
    }
    load()
    return () => { active = false }
  }, [profile.id])

  if (loading) return <Shell><Loader /></Shell>

  const completed = enrollments.filter((e) => e.status === 'completed').length
  const avgProgress = enrollments.length
    ? Math.round(enrollments.reduce((s, e) => s + e.progress, 0) / enrollments.length)
    : 0

  return (
    <Shell title={`Welcome, ${profile.full_name?.split(' ')[0]}`} subtitle="Here's where your training stands today.">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Enrolled" value={enrollments.length} accent="navy" />
        <StatCard label="Completed" value={completed} accent="teal" />
        <StatCard label="Certificates" value={certCount} accent="amber" />
        <StatCard label="Avg. progress" value={`${avgProgress}%`} accent="coral" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-navy-900">Your courses</h2>
            <Link to="/trainee/courses" className="text-sm font-semibold text-teal-600 hover:underline">Browse catalog →</Link>
          </div>

          {enrollments.length === 0 ? (
            <EmptyState
              title="No courses yet"
              hint="Enroll in a course from the catalog to start building your training record."
              action={<Link to="/trainee/courses"><Button variant="accent">Browse courses</Button></Link>}
            />
          ) : (
            <div className="flex flex-col gap-3">
              {enrollments.map((e) => (
                <Card key={e.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-navy-900">{e.courses?.title}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge tone={e.status === 'completed' ? 'teal' : 'amber'}>{e.status.replace('_', ' ')}</Badge>
                      {e.courses?.category && <span className="text-xs text-storm-500">{e.courses.category}</span>}
                    </div>
                  </div>
                  <div className="flex w-full items-center gap-3 sm:w-48">
                    <ProgressBar value={e.progress} />
                    <span className="w-10 shrink-0 text-right text-xs font-semibold text-storm-500">{e.progress}%</span>
                  </div>
                  <Link to={`/trainee/courses/${e.courses?.id}`}>
                    <Button variant="outline" className="w-full sm:w-auto">Continue</Button>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-navy-900">Announcements</h2>
          {announcements.length === 0 ? (
            <EmptyState title="Nothing posted yet" hint="Admin announcements will show up here." />
          ) : (
            <div className="flex flex-col gap-3">
              {announcements.map((a) => (
                <Card key={a.id}>
                  <p className="font-semibold text-navy-900">{a.title}</p>
                  <p className="mt-1 text-sm text-storm-500">{a.content}</p>
                  <p className="mt-2 text-xs text-storm-300">{new Date(a.created_at).toLocaleDateString()}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Shell>
  )
}
