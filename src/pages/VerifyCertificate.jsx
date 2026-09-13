import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { Badge, Button, Card, Input } from '../components/ui'

export default function VerifyCertificate() {
  const { hash: routeHash } = useParams()
  const navigate = useNavigate()
  const [hash, setHash] = useState(routeHash ?? '')
  const [certificate, setCertificate] = useState(null)
  const [loading, setLoading] = useState(Boolean(routeHash))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!routeHash) return
    verify(routeHash)
  }, [routeHash])

  async function verify(value) {
    const lookupHash = value.trim()
    if (!lookupHash) {
      setError('Enter a certificate ID or hash.')
      setCertificate(null)
      return
    }

    setLoading(true)
    setError('')
    const { data, error: queryError } = await supabase.rpc('verify_certificate', { lookup_hash: lookupHash })
    setLoading(false)

    if (queryError) {
      setError('Certificate verification is unavailable until the Supabase verification function is applied.')
      setCertificate(null)
      return
    }

    const result = data?.[0] ?? null
    setCertificate(result)
    if (!result) setError('No certificate was found for that ID. Check the hash and try again.')
  }

  function handleSubmit(event) {
    event.preventDefault()
    navigate(`/verify/${encodeURIComponent(hash.trim())}`)
  }

  return (
    <div className="min-h-screen bg-cloud-50 px-4 py-10">
      <main className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/" className="font-display text-lg font-bold text-navy-900">CAPACITY CONNECT</Link>
          <Link to="/login" className="text-sm font-semibold text-teal-600 hover:underline">Sign in</Link>
        </div>

        <Card>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-600">Public verification</p>
          <h1 className="mt-2 text-3xl font-bold">Verify a certificate</h1>
          <p className="mt-2 text-sm text-storm-500">
            Enter the certificate hash shown on the certificate, or scan its QR code.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Input
                label="Certificate ID or hash"
                value={hash}
                onChange={(event) => setHash(event.target.value)}
                placeholder="Paste the certificate hash"
              />
            </div>
            <Button type="submit" variant="accent" disabled={loading}>
              {loading ? 'Checking…' : 'Verify certificate'}
            </Button>
          </form>

          {error && <p className="mt-5 rounded-md bg-coral-100 px-3 py-2 text-sm text-coral-600">{error}</p>}

          {certificate && (
            <div className="mt-6 rounded-card border border-teal-200 bg-teal-50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-bold">Certificate is valid</h2>
                <Badge tone="teal">Authentic</Badge>
              </div>
              <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-storm-500">Awarded to</dt>
                  <dd className="mt-1 font-semibold text-navy-900">{certificate.trainee_name}</dd>
                </div>
                <div>
                  <dt className="text-storm-500">Course</dt>
                  <dd className="mt-1 font-semibold text-navy-900">{certificate.course_title}</dd>
                </div>
                <div>
                  <dt className="text-storm-500">Issued</dt>
                  <dd className="mt-1 font-semibold text-navy-900">{new Date(certificate.issued_at).toLocaleDateString()}</dd>
                </div>
                <div>
                  <dt className="text-storm-500">Certificate hash</dt>
                  <dd className="mt-1 break-all font-mono text-xs text-navy-900">{certificate.cert_hash}</dd>
                </div>
              </dl>
            </div>
          )}
        </Card>
      </main>
    </div>
  )
}
