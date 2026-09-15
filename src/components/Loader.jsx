import { useLanguage } from '../context/LanguageContext'

export default function Loader({ label = 'Loading…' }) {
  const { translate } = useLanguage()
  return (
    <div className="flex h-full min-h-[40vh] w-full flex-col items-center justify-center gap-3 text-storm-500">
      <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-cloud-200 border-t-teal-500" />
      <p className="text-sm">{translate(label)}</p>
    </div>
  )
}
