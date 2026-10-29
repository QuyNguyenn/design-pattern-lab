import { useEffect, useLayoutEffect, useState } from 'react';
import type { Theme } from '../types.ts';

const DARK_MODE_QUERY = '(prefers-color-scheme: dark)';

export function useSystemTheme(theme: Theme) {
  const [systemPrefersDark, setSystemPrefersDark] = useState(
    () => window.matchMedia(DARK_MODE_QUERY).matches,
  );
  const resolvedTheme = theme === 'system' ? (systemPrefersDark ? 'dark' : 'light') : theme;

  useEffect(() => {
    const preference = window.matchMedia(DARK_MODE_QUERY);
    const onPreferenceChange = (event: MediaQueryListEvent) => setSystemPrefersDark(event.matches);
    setSystemPrefersDark(preference.matches);
    preference.addEventListener('change', onPreferenceChange);
    return () => preference.removeEventListener('change', onPreferenceChange);
  }, []);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);
}
