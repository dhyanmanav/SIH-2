import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import AuthLayout from '../components/AuthLayout'
import { Button, Input } from '../components/ui'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setError(error.message); return }
    navigate('/', { replace: true })
  }

  return (
    <AuthLayout>
      <h1 className="text-2xl font-bold text-navy-900">Welcome back</h1>
      <p className="mt-1 text-sm text-storm-500">Sign in to continue your training.</p>

      <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
        <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@imd.gov.in" />
        <Input label="Password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />

        {error && <p className="rounded-md bg-coral-100 px-3 py-2 text-sm text-coral-600">{error}</p>}

        <Button type="submit" variant="accent" disabled={loading} className="mt-2 w-full">
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-storm-500">
        New here? <Link to="/signup" className="font-semibold text-teal-600 hover:underline">Create an account</Link>
      </p>
    </AuthLayout>
  )
}
