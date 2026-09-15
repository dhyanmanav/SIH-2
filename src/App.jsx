import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Loader from './components/Loader'
import ProtectedRoute from './components/ProtectedRoute'

import Login from './pages/Login'
import Signup from './pages/Signup'
import PendingApproval from './pages/PendingApproval'
import Profile from './pages/Profile'
import VerifyCertificate from './pages/VerifyCertificate'

import TraineeDashboard from './pages/trainee/TraineeDashboard'
import CourseCatalog from './pages/trainee/CourseCatalog'
import CourseDetail from './pages/trainee/CourseDetail'
import MyCertificates from './pages/trainee/MyCertificates'
import ImdMentor from './pages/trainee/ImdMentor'
import CompetencyMap from './pages/trainee/CompetencyMap'

import TrainerDashboard from './pages/trainer/TrainerDashboard'
import TrainerCourses from './pages/trainer/TrainerCourses'
import ManageCourse from './pages/trainer/ManageCourse'

import AdminDashboard from './pages/admin/AdminDashboard'
import ManageUsers from './pages/admin/ManageUsers'
import ManageCourses from './pages/admin/ManageCourses'
import Announcements from './pages/admin/Announcements'

function RoleHome() {
  const { user, profile, loading } = useAuth()
  if (loading) return <Loader label="Checking your session…" />
  if (!user) return <Navigate to="/login" replace />
  if (!profile) return <Navigate to="/pending-approval" replace />
  return <Navigate to={`/${profile.role}`} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/pending-approval" element={<PendingApproval />} />
      <Route path="/verify" element={<VerifyCertificate />} />
      <Route path="/verify/:hash" element={<VerifyCertificate />} />

      <Route path="/" element={<RoleHome />} />

      <Route path="/trainee" element={<ProtectedRoute role="trainee"><TraineeDashboard /></ProtectedRoute>} />
      <Route path="/trainee/courses" element={<ProtectedRoute role="trainee"><CourseCatalog /></ProtectedRoute>} />
      <Route path="/trainee/courses/:id" element={<ProtectedRoute role="trainee"><CourseDetail /></ProtectedRoute>} />
      <Route path="/trainee/certificates" element={<ProtectedRoute role="trainee"><MyCertificates /></ProtectedRoute>} />
      <Route path="/trainee/mentor" element={<ProtectedRoute role="trainee"><ImdMentor /></ProtectedRoute>} />
      <Route path="/trainee/competencies" element={<ProtectedRoute role="trainee"><CompetencyMap /></ProtectedRoute>} />
      <Route path="/trainee/profile" element={<ProtectedRoute role="trainee"><Profile /></ProtectedRoute>} />

      <Route path="/trainer" element={<ProtectedRoute role="trainer"><TrainerDashboard /></ProtectedRoute>} />
      <Route path="/trainer/courses" element={<ProtectedRoute role="trainer"><TrainerCourses /></ProtectedRoute>} />
      <Route path="/trainer/courses/:id" element={<ProtectedRoute role="trainer"><ManageCourse /></ProtectedRoute>} />
      <Route path="/trainer/profile" element={<ProtectedRoute role="trainer"><Profile /></ProtectedRoute>} />

      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute role="admin"><ManageUsers /></ProtectedRoute>} />
      <Route path="/admin/courses" element={<ProtectedRoute role="admin"><ManageCourses /></ProtectedRoute>} />
      <Route path="/admin/announcements" element={<ProtectedRoute role="admin"><Announcements /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
