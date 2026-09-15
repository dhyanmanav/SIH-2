import { useLanguage } from '../context/LanguageContext'

export default function EmptyState({ title, hint, action }) {
  const { translate } = useLanguage()
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-card border border-dashed border-cloud-200 bg-white/60 px-6 py-14 text-center">
      <h3 className="text-base font-semibold text-navy-900">{translate(title)}</h3>
      {hint && <p className="max-w-sm text-sm text-storm-500">{translate(hint)}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
