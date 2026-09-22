import type { Lang } from '../lib/types';
import { useLang } from '../i18n';

const LANGS: { key: Lang; label: string }[] = [
  { key: 'zh', label: '中' },
  { key: 'en', label: 'EN' },
];

export function Header({ range }: { range: string }) {
  const { lang, t, setLang } = useLang();
  return (
    <header className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
          {t.title}
        </h1>
        <p className="mt-1.5 text-sm text-muted">{range}</p>
      </div>
      <div
        className="flex shrink-0 rounded-lg border border-line bg-card p-0.5"
        role="group"
        aria-label="Language"
      >
        {LANGS.map((l) => (
          <button
            key={l.key}
            onClick={() => setLang(l.key)}
            aria-pressed={lang === l.key}
            className={`rounded-[6px] px-2.5 py-1 text-sm transition-colors ${
              lang === l.key ? 'bg-hover text-primary' : 'text-dim hover:text-secondary'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>
    </header>
  );
}
