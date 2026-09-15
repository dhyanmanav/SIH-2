import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import Shell from '../components/Shell'
import { Card, Input, Textarea, Button, Badge } from '../components/ui'
import { useLanguage } from '../context/LanguageContext'

export default function Profile() {
  const { profile, refreshProfile } = useAuth()
  const [form, setForm] = useState({
    full_name: profile.full_name ?? '',
    designation: profile.designation ?? '',
    region: profile.region ?? '',
    qualifications: profile.qualifications ?? '',
    bio: profile.bio ?? '',
    skillsInput: (profile.skills ?? []).join(', '),
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const { translate, t } = useLanguage()

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setSaved(false) }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const skills = form.skillsInput.split(',').map((s) => s.trim()).filter(Boolean)
    await supabase.from('profiles').update({
      full_name: form.full_name,
      designation: form.designation,
      region: form.region,
      qualifications: form.qualifications,
      bio: form.bio,
      skills,
    }).eq('id', profile.id)
    await refreshProfile()
    setSaving(false)
    setSaved(true)
  }

  return (
    <Shell title={t.profile} subtitle={profile.role === 'trainer' ? translate('What you teach and where you come from.') : translate('Your qualifications, skills and background.')}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="flex flex-col items-center gap-3 text-center lg:col-span-1">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-teal-500 text-2xl font-bold text-white">
            {form.full_name?.[0] ?? '?'}
          </div>
          <div>
            <p className="font-semibold text-navy-900">{form.full_name}</p>
            <p className="text-sm text-storm-500">{profile.email}</p>
          </div>
          <Badge tone="teal">{profile.role}</Badge>
          <div className="mt-2 flex flex-wrap justify-center gap-1.5">
            {(profile.skills ?? []).map((s) => <Badge key={s}>{s}</Badge>)}
          </div>
        </Card>

        <Card className="flex flex-col gap-4 lg:col-span-2">
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Full name" value={form.full_name} onChange={set('full_name')} />
              <Input label="Designation" value={form.designation} onChange={set('designation')} placeholder="Scientist-C" />
              <Input label="Region / office" value={form.region} onChange={set('region')} placeholder="Bengaluru RMC" />
              <Input label="Skills (comma separated)" value={form.skillsInput} onChange={set('skillsInput')} placeholder="Radar, GIS, Forecasting" />
            </div>
            <Input label="Qualifications" value={form.qualifications} onChange={set('qualifications')} placeholder="M.Sc. Meteorology" />
            <Textarea label="Bio" rows={4} value={form.bio} onChange={set('bio')} placeholder="A short note about your background and interests." />
            <Button type="submit" variant="accent" disabled={saving} className="w-fit">
              {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save changes'}
            </Button>
          </form>
        </Card>
      </div>
    </Shell>
  )
}
