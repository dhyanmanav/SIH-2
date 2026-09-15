import { LocalizedContent, useLanguage } from '../context/LanguageContext'

export default function AuthLayout({ children }) {
  const { language, setLanguage, languages, t } = useLanguage()

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-navy-950 p-12 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 20%, #128F8C55, transparent 40%), radial-gradient(circle at 85% 75%, #F2A93B44, transparent 45%)',
          }}
        />
        <div className="relative z-10">
          <p className="font-display text-xl font-bold">CAPACITY CONNECT</p>
          <p className="mt-1 text-sm text-storm-300">India Meteorological Department</p>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="font-display text-4xl font-semibold leading-[1.15]">
            One record for every scientist, technician and field officer.
          </h2>
          <p className="mt-4 text-storm-300">
            Courses, quizzes and certificates in one place — built to keep working even at
            remote weather stations with patchy internet.
          </p>
        </div>

        <div className="relative z-10 flex gap-6 text-sm text-storm-300">
          <div>
            <p className="font-display text-2xl font-bold text-white">3</p>
            <p>Roles, one portal</p>
          </div>
          <div>
            <p className="font-display text-2xl font-bold text-white">24×7</p>
            <p>Offline-ready access</p>
          </div>
          <div>
            <p className="font-display text-2xl font-bold text-white">100%</p>
            <p>Verifiable certificates</p>
          </div>
        </div>
      </div>

      <div className="relative flex items-center justify-center bg-cloud-50 px-6 py-12">
        <label className="absolute right-6 top-6 flex items-center gap-2 text-xs text-storm-500">
          <span>{t.language}</span>
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            className="rounded border border-cloud-200 bg-white px-2 py-1 text-xs text-navy-900"
            aria-label={t.language}
          >
            {languages.map((item) => <option key={item.code} value={item.code}>{item.nativeLabel}</option>)}
          </select>
        </label>
        <div className="w-full max-w-sm"><LocalizedContent>{children}</LocalizedContent></div>
      </div>
    </div>
  )
}
