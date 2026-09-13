import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV = {
  trainee: [
    { to: '/trainee', label: 'Overview', icon: '◎' },
    { to: '/trainee/courses', label: 'Course catalog', icon: '▤' },
    { to: '/trainee/certificates', label: 'Certificates', icon: '✓' },
    { to: '/trainee/mentor', label: 'IMD AI mentor', icon: '✦' },
    { to: '/trainee/profile', label: 'My profile', icon: '☺' },
  ],
  trainer: [
    { to: '/trainer', label: 'Overview', icon: '◎' },
    { to: '/trainer/courses', label: 'My courses', icon: '▤' },
    { to: '/trainer/profile', label: 'My profile', icon: '☺' },
  ],
  admin: [
    { to: '/admin', label: 'Overview', icon: '◎' },
    { to: '/admin/users', label: 'People', icon: '☺' },
    { to: '/admin/courses', label: 'Courses', icon: '▤' },
    { to: '/admin/announcements', label: 'Announcements', icon: '✎' },
  ],
}

const ROLE_LABEL = { trainee: 'Trainee', trainer: 'Trainer', admin: 'Admin' }

export default function Shell({ children, title, subtitle }) {
  const { profile, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const links = NAV[profile?.role] ?? []

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-cloud-50">
      {/* mobile top bar */}
      <div className="flex items-center justify-between border-b border-cloud-200 bg-white px-4 py-3 lg:hidden">
        <button
          onClick={() => setOpen(true)}
          className="focus-ring rounded-md p-2 text-navy-900"
          aria-label="Open menu"
        >
          ☰
        </button>
        <span className="font-display text-sm font-semibold text-navy-900">CAPACITY CONNECT</span>
        <div className="h-8 w-8 rounded-full bg-teal-500 text-center text-sm font-semibold leading-8 text-white">
          {(profile?.full_name || '?')[0]}
        </div>
      </div>

      <div className="mx-auto flex max-w-[1400px]">
        {/* sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 transform border-r border-cloud-200 bg-navy-950 p-5 text-cloud-50 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="font-display text-lg font-bold leading-tight text-white">CAPACITY<br />CONNECT</p>
              <p className="mt-1 text-xs text-storm-300">India Meteorological Dept.</p>
            </div>
            <button onClick={() => setOpen(false)} className="focus-ring rounded-md p-1 text-cloud-100 lg:hidden" aria-label="Close menu">✕</button>
          </div>

          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === `/${profile?.role}`}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `focus-ring flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive ? 'bg-teal-600 text-white' : 'text-storm-300 hover:bg-navy-800 hover:text-white'
                  }`
                }
              >
                <span className="w-4 text-center">{l.icon}</span>
                {l.label}
              </NavLink>
            ))}
            <NavLink
              to="/verify"
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `focus-ring flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-teal-600 text-white' : 'text-storm-300 hover:bg-navy-800 hover:text-white'
                }`
              }
            >
              <span className="w-4 text-center">⌕</span>
              Verify certificate
            </NavLink>
          </nav>

          <div className="absolute bottom-5 left-5 right-5 rounded-card bg-navy-900 p-3.5">
            <p className="truncate text-sm font-semibold text-white">{profile?.full_name}</p>
            <p className="text-xs text-storm-300">{ROLE_LABEL[profile?.role] ?? '—'}</p>
            <button
              onClick={handleSignOut}
              className="focus-ring mt-3 w-full rounded-md border border-navy-700 py-1.5 text-xs font-medium text-cloud-100 hover:bg-navy-800"
            >
              Sign out
            </button>
          </div>
        </aside>

        {open && (
          <div className="fixed inset-0 z-30 bg-navy-950/40 lg:hidden" onClick={() => setOpen(false)} />
        )}

        {/* main content */}
        <main className="min-h-screen flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          {(title || subtitle) && (
            <div className="mb-7">
              {title && <h1 className="text-2xl font-bold sm:text-[26px]">{title}</h1>}
              {subtitle && <p className="mt-1 text-sm text-storm-500">{subtitle}</p>}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  )
}
