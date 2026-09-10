import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import Shell from '../../components/Shell'
import Loader from '../../components/Loader'
import EmptyState from '../../components/EmptyState'
import { Card, Badge, Button, Input, Textarea } from '../../components/ui'

const PALETTE = ['#0B3D5C', '#128F8C', '#F2A93B', '#E7594F']

export default function TrainerCourses() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', category: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const { data } = await supabase.from('courses').select('*').eq('trainer_id', profile.id).order('created_at', { ascending: false })
    setCourses(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [profile.id])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    await supabase.from('courses').insert({
      ...form,
      trainer_id: profile.id,
      status: 'draft',
      cover_color: PALETTE[courses.length % PALETTE.length],
    })
    setForm({ title: '', description: '', category: '' })
    setShowForm(false)
    setSaving(false)
    load()
  }

  const togglePublish = async (course) => {
    await supabase.from('courses').update({ status: course.status === 'published' ? 'draft' : 'published' }).eq('id', course.id)
    load()
  }

  if (loading) return <Shell><Loader /></Shell>

  return (
    <Shell title="My courses" subtitle="Create courses, then open one to add material and quizzes.">
      <Button variant="accent" className="mb-6" onClick={() => setShowForm((s) => !s)}>
        {showForm ? 'Cancel' : '+ New course'}
      </Button>

      {showForm && (
        <Card className="mb-6 flex flex-col gap-4">
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <Input label="Title" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Cyclone Forecasting Fundamentals" />
            <Textarea label="Description" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="What will trainees learn?" />
            <Input label="Category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="Forecasting" />
            <Button type="submit" variant="accent" disabled={saving} className="w-fit">{saving ? 'Creating…' : 'Create course'}</Button>
          </form>
        </Card>
      )}

      {courses.length === 0 ? (
        <EmptyState title="No courses yet" hint="Use the button above to create your first course." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((c) => (
            <Card key={c.id} className="flex flex-col gap-3">
              <div className="h-2 w-10 rounded-full" style={{ background: c.cover_color }} />
              <div>
                <p className="font-semibold text-navy-900">{c.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-storm-500">{c.description}</p>
              </div>
              <Badge tone={c.status === 'published' ? 'teal' : 'amber'}>{c.status}</Badge>
              <div className="mt-auto flex gap-2">
                <Link to={`/trainer/courses/${c.id}`} className="flex-1"><Button variant="outline" className="w-full">Manage</Button></Link>
                <Button variant="ghost" onClick={() => togglePublish(c)} className="flex-1">
                  {c.status === 'published' ? 'Unpublish' : 'Publish'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Shell>
  )
}
