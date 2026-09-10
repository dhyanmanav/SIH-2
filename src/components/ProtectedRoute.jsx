import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Loader from './Loader'

export default function ProtectedRoute({ role, children }) {
  const { user, profile, loading } = useAuth()

  if (loading) return <Loader label="Checking your session…" />
  if (!user) return <Navigate to="/login" replace />
  if (!profile) return <Loader label="Setting up your profile…" />
  if (profile.status !== 'approved') return <Navigate to="/pending-approval" replace />
  if (role && profile.role !== role) return <Navigate to={`/${profile.role}`} replace />

  return children
}
