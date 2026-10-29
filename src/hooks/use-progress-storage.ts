import { useEffect, useState } from 'react';
import { STORAGE_KEY, emptyProgress, parseProgress } from '../engine.ts';
import type { Language, Progress, Theme } from '../types.ts';

export function useProgressStorage() {
  const [initial] = useState(() => {
    try {
      return { progress: parseProgress(localStorage.getItem(STORAGE_KEY)), error: '' };
    } catch {
      return {
        progress: emptyProgress(),
        error:
          'Saved progress could not be loaded. A fresh session is available; browser storage may be unavailable or the saved data may be damaged.',
      };
    }
  });
  const [progress, setProgress] = useState<Progress>(initial.progress);
  const [storageError, setStorageError] = useState(initial.error);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      setStorageError(
        'Progress cannot be saved in this browser. You can keep practicing, but changes may be lost when you close or refresh this page.',
      );
    }
  }, [progress]);

  function setLanguage(language: Language) {
    setProgress((current) => ({ ...current, language }));
  }

  function setTheme(theme: Theme) {
    setProgress((current) => ({ ...current, theme }));
  }

  return { progress, setProgress, storageError, setLanguage, setTheme };
}
