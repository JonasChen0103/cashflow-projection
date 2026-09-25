import type { Lang, Theme } from '../lib/types';
import { useLang } from '../i18n';

const LANGS: { key: Lang; label: string }[] = [
  { key: 'zh', label: '中' },
  { key: 'en', label: 'EN' },
];

interface Props {
  range: string;
  months: number;
  theme: Theme;
  onTheme: (t: Theme) => void;
}

export function Header({ range, months, theme, onTheme }: Props) {
  const { lang, t, setLang } = useLang();
  const dark = theme === 'dark';

  return (
    <header className="flex items-start justify-between gap-4 pt-1">
      <div className="min-w-0">
        <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-blue">
          <span className="inline-block size-1.5 animate-pulse rounded-full bg-blue shadow-[0_0_8px_var(--color-blue)]" />
          cashflow // forecast
        </p>
        <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-primary [font-synthesis-weight:none] sm:text-4xl">
          {t.title}
        </h1>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-muted">
          <span>{range}</span>
          <span className="text-ghost">/</span>
          <span className="text-dim">
            {months} {t.monthsUnit}
          </span>
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={() => onTheme(dark ? 'light' : 'dark')}
          aria-pressed={!dark}
          title={t.theme}
          aria-label={t.theme}
          className="rounded-lg border border-line bg-card/70 px-2.5 py-1.5 text-sm leading-none text-dim transition-colors hover:border-blue hover:text-blue"
        >
          {dark ? '☀' : '☾'}
        </button>
        <div
          className="flex rounded-lg border border-line bg-card/70 p-0.5"
          role="group"
          aria-label="Language"
        >
          {LANGS.map((l) => (
            <button
              key={l.key}
              onClick={() => setLang(l.key)}
              aria-pressed={lang === l.key}
              className={`rounded-[6px] px-2.5 py-1 text-sm transition-colors ${
                lang === l.key
                  ? 'bg-blue/15 text-blue shadow-[inset_0_0_0_1px_var(--color-blue)]'
                  : 'text-dim hover:text-secondary'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
