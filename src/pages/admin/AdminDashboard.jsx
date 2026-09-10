import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import Shell from '../../components/Shell'
import Loader from '../../components/Loader'
import EmptyState from '../../components/EmptyState'
import { Card, StatCard, Badge, Button, ProgressBar } from '../../components/ui'

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [pendingUsers, setPendingUsers] = useState([])
  const [stats, setStats] = useState({ trainees: 0, trainers: 0, courses: 0, certs: 0 })
  const [regionBreakdown, setRegionBreakdown] = useState([])

  useEffect(() => {
    async function load() {
      const [{ data: pending }, { data: profiles }, { count: courseCount }, { count: certCount }] = await Promise.all([
        supabase.from('profiles').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
        supabase.from('profiles').select('role, region').eq('status', 'approved'),
        supabase.from('courses').select('*', { count: 'exact', head: true }),
        supabase.from('certificates').select('*', { count: 'exact', head: true }),
      ])
      setPendingUsers(pending ?? [])
      setStats({
        trainees: (profiles ?? []).filter((p) => p.role === 'trainee').length,
        trainers: (profiles ?? []).filter((p) => p.role === 'trainer').length,
        courses: courseCount ?? 0,
        certs: certCount ?? 0,
      })
      const byRegion = (profiles ?? []).reduce((acc, p) => {
        const key = p.region || 'Unspecified'
        acc[key] = (acc[key] ?? 0) + 1
        return acc
      }, {})
      const max = Math.max(1, ...Object.values(byRegion))
      setRegionBreakdown(Object.entries(byRegion).map(([region, count]) => ({ region, count, pct: Math.round((count / max) * 100) })))
      setLoading(false)
    }
    load()
  }, [])

  const approve = async (userId) => {
    await supabase.from('profiles').update({ status: 'approved' }).eq('id', userId)
    setPendingUsers((p) => p.filter((u) => u.id !== userId))
  }

  if (loading) return <Shell><Loader /></Shell>

  return (
    <Shell title="Admin overview" subtitle="Organization-wide training status at a glance.">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Trainees" value={stats.trainees} accent="navy" />
        <StatCard label="Trainers" value={stats.trainers} accent="teal" />
        <StatCard label="Courses" value={stats.courses} accent="amber" />
        <StatCard label="Certificates issued" value={stats.certs} accent="coral" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-navy-900">Pending approvals</h2>
            <Link to="/admin/users" className="text-sm font-semibold text-teal-600 hover:underline">See all people →</Link>
          </div>
          {pendingUsers.length === 0 ? (
            <EmptyState title="Nothing to approve" hint="New sign-ups will show up here for your review." />
          ) : (
            <div className="flex flex-col gap-3">
              {pendingUsers.map((u) => (
                <Card key={u.id} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-navy-900">{u.full_name}</p>
                    <p className="text-xs text-storm-500">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{u.role}</Badge>
                    <Button variant="accent" onClick={() => approve(u.id)}>Approve</Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-navy-900">Participation by region</h2>
          <Card className="flex flex-col gap-3">
            {regionBreakdown.length === 0 ? (
              <p className="text-sm text-storm-500">No approved staff yet.</p>
            ) : (
              regionBreakdown.map((r) => (
                <div key={r.region}>
                  <div className="mb-1 flex justify-between text-xs font-semibold text-storm-500">
                    <span>{r.region}</span><span>{r.count}</span>
                  </div>
                  <ProgressBar value={r.pct} />
                </div>
              ))
            )}
          </Card>
        </div>
      </div>
    </Shell>
  )
}
