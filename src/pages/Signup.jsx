import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import AuthLayout from '../components/AuthLayout'
import { Button, Input, Select } from '../components/ui'
import { useLanguage } from '../context/LanguageContext'

export default function Signup() {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'trainee', designation: '', region: '' })
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { translate } = useLanguage()

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.fullName, role: form.role },
      },
    })
    if (error) {
      setLoading(false)
      setError(error.message || 'Unable to create your account. Please try again.')
      return
    }

    // if email confirmation is off, we already have a session -> save the extra details
    if (data.session && data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ designation: form.designation, region: form.region })
        .eq('id', data.user.id)

      if (profileError) {
        setLoading(false)
        setError(profileError.message)
        return
      }
    }

    setLoading(false)
    setDone(true)
    setTimeout(() => navigate('/login'), 2500)
  }

  if (done) {
    return (
      <AuthLayout>
        <h1 className="text-2xl font-bold text-navy-900">{translate('Account created')}</h1>
        <p className="mt-2 text-sm text-storm-500">
          {translate('An admin needs to approve your account before you can sign in. You will be redirected to')}
          the login page shortly.
        </p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <h1 className="text-2xl font-bold text-navy-900">{translate('Create your account')}</h1>
      <p className="mt-1 text-sm text-storm-500">{translate('Get approved, then start training.')}</p>

      <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
        <Input label="Full name" required value={form.fullName} onChange={set('fullName')} placeholder="A. Sharma" />
        <Input label="Email" type="email" required value={form.email} onChange={set('email')} placeholder="you@imd.gov.in" />
        <Input label="Password" type="password" required minLength={6} value={form.password} onChange={set('password')} placeholder="At least 6 characters" />
        <Select label="I am joining as a" value={form.role} onChange={set('role')}>
          <option value="trainee">Trainee</option>
          <option value="trainer">Trainer</option>
          <option value="admin">Admin</option>
        </Select>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Designation" value={form.designation} onChange={set('designation')} placeholder="Scientist-C" />
          <Input label="Region" value={form.region} onChange={set('region')} placeholder="Bengaluru" />
        </div>

        {error && <p className="rounded-md bg-coral-100 px-3 py-2 text-sm text-coral-600">{error}</p>}

        <Button type="submit" variant="accent" disabled={loading} className="mt-2 w-full">
          {loading ? translate('Creating account…') : translate('Create account')}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-storm-500">
        {translate('Already have an account?')} <Link to="/login" className="font-semibold text-teal-600 hover:underline">{translate('Sign in')}</Link>
      </p>
    </AuthLayout>
  )
}
