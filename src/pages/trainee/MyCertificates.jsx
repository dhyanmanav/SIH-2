import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import Shell from '../../components/Shell'
import Loader from '../../components/Loader'
import EmptyState from '../../components/EmptyState'
import { Card, Badge } from '../../components/ui'

export default function MyCertificates() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [certs, setCerts] = useState([])

  useEffect(() => {
    supabase
      .from('certificates')
      .select('*, courses(title, category)')
      .eq('trainee_id', profile.id)
      .order('issued_at', { ascending: false })
      .then(({ data }) => { setCerts(data ?? []); setLoading(false) })
  }, [profile.id])

  if (loading) return <Shell><Loader /></Shell>

  return (
    <Shell title="My certificates" subtitle="Every certificate here is sealed with a unique, tamper-evident hash.">
      {certs.length === 0 ? (
        <EmptyState title="No certificates yet" hint="Complete a course and pass its tests to earn your first certificate." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {certs.map((c) => (
            <Card key={c.id} className="flex flex-col gap-3 border-l-4 border-l-amber-500">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-navy-900">{c.courses?.title}</p>
                <Badge tone="amber">Sealed</Badge>
              </div>
              {c.courses?.category && <Badge>{c.courses.category}</Badge>}
              <p className="text-xs text-storm-500">Issued {new Date(c.issued_at).toLocaleDateString()}</p>
              <p className="break-all rounded-md bg-cloud-100 px-2 py-1.5 font-mono text-[10px] text-storm-500">{c.cert_hash}</p>
            </Card>
          ))}
        </div>
      )}
    </Shell>
  )
}
