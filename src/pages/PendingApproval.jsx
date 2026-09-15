import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import AuthLayout from '../components/AuthLayout'
import { Button } from '../components/ui'
import { useLanguage } from '../context/LanguageContext'
import { useNavigate } from 'react-router-dom'

export default function PendingApproval() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const { translate } = useLanguage()

  const handleSignOut = async () => {
    setError('')
    const { error: signOutError } = await signOut()
    if (signOutError) {
      setError(signOutError.message)
      return
    }
    navigate('/login', { replace: true })
  }

  return (
    <AuthLayout>
      <div className="rounded-card border border-amber-500/30 bg-amber-100 px-4 py-3 text-sm text-amber-500">
        {translate('Awaiting admin approval')}
      </div>
      <h1 className="mt-4 text-2xl font-bold text-navy-900">{translate('Hi')}, {profile?.full_name?.split(' ')[0]}, {translate('hang tight')}</h1>
      <p className="mt-2 text-sm text-storm-500">
        {translate('Your account has been created as a')} <strong>{profile?.role}</strong>. {translate('An administrator needs to review and approve it before you can access CAPACITY CONNECT.')}
        to review and approve it before you can access CAPACITY CONNECT. This is usually quick —
        check back soon.
      </p>
      {error && <p className="mt-4 rounded-md bg-coral-100 px-3 py-2 text-sm text-coral-600">{error}</p>}
      <Button variant="outline" className="mt-6 w-full" onClick={handleSignOut}>{translate('Sign out')}</Button>
    </AuthLayout>
  )
}
