import { useLang } from '../i18n';

export function Header({ range }: { range: string }) {
  const { lang, t, setLang } = useLang();
  return (
    <header className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-primary">{t.title}</h1>
        <p className="mt-1 text-sm text-muted">{range}</p>
      </div>
      <button
        onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
        className="rounded-lg border border-line bg-card px-3 py-1.5 text-sm text-secondary hover:bg-hover"
        aria-label="Switch language"
      >
        {lang === 'zh' ? 'EN' : '中文'}
      </button>
    </header>
  );
}
