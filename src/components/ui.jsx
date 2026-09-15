import { useLanguage } from '../context/LanguageContext'

export function Card({ children, className = '' }) {
  return <div className={`rounded-card border border-cloud-200 bg-white p-5 shadow-soft ${className}`}>{children}</div>
}

export function StatCard({ label, value, accent = 'teal' }) {
  const { translate } = useLanguage()
  const bg = { teal: 'bg-teal-100 text-teal-600', amber: 'bg-amber-100 text-amber-500', coral: 'bg-coral-100 text-coral-600', navy: 'bg-cloud-100 text-navy-900' }[accent]
  return (
    <Card className="flex flex-col gap-2">
      <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${bg}`}>{translate(label)}</span>
      <p className="font-display text-3xl font-bold text-navy-900">{value}</p>
    </Card>
  )
}

export function Badge({ children, tone = 'storm' }) {
  const { translate } = useLanguage()
  const tones = {
    storm: 'bg-cloud-100 text-storm-700',
    teal: 'bg-teal-100 text-teal-600',
    amber: 'bg-amber-100 text-amber-500',
    coral: 'bg-coral-100 text-coral-600',
  }
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}>{typeof children === 'string' ? translate(children) : children}</span>
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const { translate } = useLanguage()
  const base = 'focus-ring inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50'
  const variants = {
    primary: 'bg-navy-900 text-white hover:bg-navy-800',
    accent: 'bg-teal-600 text-white hover:bg-teal-500',
    outline: 'border border-cloud-200 bg-white text-navy-900 hover:bg-cloud-100',
    ghost: 'text-navy-900 hover:bg-cloud-100',
    danger: 'bg-coral-600 text-white hover:bg-coral-600/90',
  }
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {typeof children === 'string' ? translate(children) : children}
    </button>
  )
}

export function Input({ label, className = '', ...props }) {
  const { translate } = useLanguage()
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      {label && <span className="font-medium text-navy-900">{translate(label)}</span>}
      <input
        className={`focus-ring rounded-md border border-cloud-200 bg-white px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-storm-300 ${className}`}
        {...props}
      />
    </label>
  )
}

export function Textarea({ label, className = '', ...props }) {
  const { translate } = useLanguage()
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      {label && <span className="font-medium text-navy-900">{translate(label)}</span>}
      <textarea
        className={`focus-ring rounded-md border border-cloud-200 bg-white px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-storm-300 ${className}`}
        {...props}
      />
    </label>
  )
}

export function Select({ label, children, className = '', ...props }) {
  const { translate } = useLanguage()
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      {label && <span className="font-medium text-navy-900">{translate(label)}</span>}
      <select
        className={`focus-ring rounded-md border border-cloud-200 bg-white px-3.5 py-2.5 text-sm text-navy-900 ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  )
}

export function ProgressBar({ value }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-cloud-100">
      <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  )
}
