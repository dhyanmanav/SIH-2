import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import jsPDF from 'jspdf'
import QRCode from 'qrcode'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import Shell from '../../components/Shell'
import Loader from '../../components/Loader'
import EmptyState from '../../components/EmptyState'
import { Button, Card, Badge } from '../../components/ui'

const verificationUrl = (hash) => `${window.location.origin}/verify/${encodeURIComponent(hash)}`

async function downloadCertificate(certificate) {
  const verifyUrl = verificationUrl(certificate.cert_hash)
  const qrCode = await QRCode.toDataURL(verifyUrl, { width: 220, margin: 1 })
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  doc.setFillColor(11, 61, 92)
  doc.rect(0, 0, 297, 210, 'F')
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(14, 14, 269, 182, 4, 4, 'F')
  doc.setTextColor(11, 61, 92)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('CAPACITY CONNECT', 26, 31)
  doc.setFontSize(25)
  doc.text('Certificate of Completion', 26, 58)
  doc.setTextColor(79, 96, 112)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text('This certifies that', 26, 78)
  doc.setTextColor(11, 61, 92)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.text(certificate.trainee_name ?? 'Certificate holder', 26, 94)
  doc.setTextColor(79, 96, 112)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text('has successfully completed', 26, 111)
  doc.setTextColor(11, 61, 92)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(17)
  doc.text(certificate.courses?.title ?? 'Training course', 26, 124)
  doc.setTextColor(79, 96, 112)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Issued ${new Date(certificate.issued_at).toLocaleDateString()}`, 26, 143)
  doc.text(`Certificate ID: ${certificate.cert_hash}`, 26, 153)
  doc.text('Scan the QR code or visit the verification link to confirm authenticity.', 26, 169)
  doc.addImage(qrCode, 'PNG', 226, 46, 38, 38)
  doc.setFontSize(8)
  doc.text(verifyUrl, 197, 93, { maxWidth: 70, align: 'center' })
  doc.save(`capacity-connect-certificate-${certificate.cert_hash.slice(0, 12)}.pdf`)
}

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
              <div className="mt-auto flex flex-wrap gap-2 pt-2">
                <Button type="button" variant="accent" onClick={() => downloadCertificate({ ...c, trainee_name: profile.full_name })}>
                  Download PDF
                </Button>
                <Link
                  to={`/verify/${encodeURIComponent(c.cert_hash)}`}
                  className="focus-ring inline-flex items-center justify-center rounded-md border border-cloud-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy-900 hover:bg-cloud-100"
                >
                  Verify
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Shell>
  )
}
