import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import Shell from '../../components/Shell'
import Loader from '../../components/Loader'
import EmptyState from '../../components/EmptyState'
import { Card, Badge, Button, Select, Input } from '../../components/ui'

const STATUS_TONE = { approved: 'teal', pending: 'amber', rejected: 'coral' }

export default function ManageUsers() {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const load = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setUsers(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const updateStatus = async (id, status) => {
    await supabase.from('profiles').update({ status }).eq('id', id)
    load()
  }

  const updateRole = async (id, role) => {
    await supabase.from('profiles').update({ role }).eq('id', id)
    load()
  }

  const filtered = users.filter((u) => {
    const matchesQuery = (u.full_name + u.email).toLowerCase().includes(query.toLowerCase())
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter
    return matchesQuery && matchesRole && matchesStatus
  })

  if (loading) return <Shell><Loader /></Shell>

  return (
    <Shell title="People" subtitle="Approve sign-ups, manage roles.">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <Input placeholder="Search by name or email…" value={query} onChange={(e) => setQuery(e.target.value)} className="sm:max-w-xs" />
        <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="sm:max-w-[160px]">
          <option value="all">All roles</option>
          <option value="trainee">Trainee</option>
          <option value="trainer">Trainer</option>
          <option value="admin">Admin</option>
        </Select>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:max-w-[160px]">
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No matching people" />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((u) => (
            <Card key={u.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-navy-900">{u.full_name}</p>
                <p className="text-xs text-storm-500">{u.email}{u.region ? ` · ${u.region}` : ''}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={STATUS_TONE[u.status]}>{u.status}</Badge>
                <Select value={u.role} onChange={(e) => updateRole(u.id, e.target.value)} className="!py-1.5 text-xs">
                  <option value="trainee">Trainee</option>
                  <option value="trainer">Trainer</option>
                  <option value="admin">Admin</option>
                </Select>
                {u.status !== 'approved' && <Button variant="accent" onClick={() => updateStatus(u.id, 'approved')}>Approve</Button>}
                {u.status !== 'rejected' && <Button variant="danger" onClick={() => updateStatus(u.id, 'rejected')}>Reject</Button>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </Shell>
  )
}
