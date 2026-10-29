import type { Language } from '../types.ts';

interface LanguageSwitchProps {
  value: Language;
  onChange: (language: Language) => void;
}

export function LanguageSwitch({ value, onChange }: LanguageSwitchProps) {
  return (
    <div className="segmented" role="group" aria-label="Code language">
      {(['typescript', 'java'] as const).map((language) => (
        <button
          key={language}
          aria-pressed={value === language}
          className={value === language ? 'selected' : ''}
          onClick={() => onChange(language)}
        >
          {language === 'java' ? 'Java' : 'TypeScript'}
        </button>
      ))}
    </div>
  );
}
