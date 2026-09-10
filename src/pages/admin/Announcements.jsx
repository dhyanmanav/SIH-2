import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import Shell from '../../components/Shell'
import Loader from '../../components/Loader'
import EmptyState from '../../components/EmptyState'
import { Card, Button, Input, Textarea } from '../../components/ui'

export default function Announcements() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ title: '', content: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false })
    setItems(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handlePost = async (e) => {
    e.preventDefault()
    if (!form.title || !form.content) return
    setSaving(true)
    await supabase.from('announcements').insert({ ...form, created_by: profile.id })
    setForm({ title: '', content: '' })
    setSaving(false)
    load()
  }

  const remove = async (id) => {
    await supabase.from('announcements').delete().eq('id', id)
    load()
  }

  if (loading) return <Shell><Loader /></Shell>

  return (
    <Shell title="Announcements" subtitle="Post updates that everyone sees on their dashboard.">
      <Card className="mb-6">
        <form onSubmit={handlePost} className="flex flex-col gap-3">
          <Input label="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="New monsoon forecasting module live" />
          <Textarea label="Message" rows={3} value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} placeholder="Write the announcement…" />
          <Button type="submit" variant="accent" disabled={saving} className="w-fit">{saving ? 'Posting…' : 'Post announcement'}</Button>
        </form>
      </Card>

      {items.length === 0 ? (
        <EmptyState title="Nothing posted yet" />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((a) => (
            <Card key={a.id} className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-navy-900">{a.title}</p>
                <p className="mt-1 text-sm text-storm-500">{a.content}</p>
                <p className="mt-2 text-xs text-storm-300">{new Date(a.created_at).toLocaleString()}</p>
              </div>
              <button onClick={() => remove(a.id)} className="focus-ring shrink-0 text-xs font-semibold text-coral-600">Remove</button>
            </Card>
          ))}
        </div>
      )}
    </Shell>
  )
}
