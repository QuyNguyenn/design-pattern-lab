import { useCallback } from 'react';
import { createSession, defaultFilters } from '../engine.ts';
import { questionById } from '../data/index.ts';
import type { Filters } from '../engine.ts';
import type { Session } from '../types.ts';
import type { Confirmation } from '../components/index.ts';
import type { Page } from './use-hash-navigation.ts';
import type { Dispatch, SetStateAction } from 'react';
import type { Progress } from '../types.ts';

interface LearningActionsOptions {
  active: Session | null;
  setProgress: Dispatch<SetStateAction<Progress>>;
  setConfirmation: Dispatch<SetStateAction<Confirmation | null>>;
  setFilters: Dispatch<SetStateAction<Filters>>;
  navigate: (page: Page) => void;
}

export function useLearningActions({
  active,
  setProgress,
  setConfirmation,
  setFilters,
  navigate,
}: LearningActionsOptions) {
  const begin = useCallback(
    (session: Session) => {
      if (!session.questionIds.length) return;
      const start = () => {
        setProgress((current) => ({ ...current, session }));
        navigate('practice');
      };

      if (active && !active.finished) {
        setConfirmation({
          title: 'Start a new session?',
          body: 'This replaces your current session, including any unchecked selection. Checked answers and bookmarks stay in your learning history.',
          action: 'Start session',
          run: start,
        });
      } else {
        start();
      }
    },
    [active, navigate, setConfirmation, setProgress],
  );

  const focusPool = useCallback(
    (pool: Filters['pool']) => {
      setFilters({ ...defaultFilters, pool });
      navigate('dashboard');
      window.setTimeout(
        () => document.getElementById('practice-builder')?.scrollIntoView({ behavior: 'smooth' }),
        50,
      );
    },
    [navigate, setFilters],
  );

  const toggleBookmark = useCallback(
    (questionId: string) => {
      setProgress((current) => ({
        ...current,
        bookmarks: current.bookmarks.includes(questionId)
          ? current.bookmarks.filter((id) => id !== questionId)
          : [...current.bookmarks, questionId],
      }));
    },
    [setProgress],
  );

  const restart = useCallback(() => {
    if (!active) return;
    setConfirmation({
      title: 'Restart this session?',
      body: 'Answers in this session will be cleared. Your checked-answer history and bookmarks will stay saved.',
      action: 'Restart session',
      run: () => {
        const session = createSession(
          active.questionIds.map((id) => questionById[id]),
          active.title,
          active.questionIds.length,
          false,
        );
        session.options = active.options;
        setProgress((current) => ({ ...current, session }));
        navigate('practice');
      },
    });
  }, [active, navigate, setConfirmation, setProgress]);

  const cancelSession = useCallback(() => {
    if (!active || active.finished) return;
    setConfirmation({
      title: 'Cancel this session?',
      body: 'This clears the current session, including unchecked selections. Checked answers stay in your progress, and bookmarks are kept.',
      action: 'End session',
      danger: true,
      run: () => {
        setProgress((current) => ({ ...current, session: null }));
        navigate('practice');
      },
    });
  }, [active, navigate, setConfirmation, setProgress]);

  return { begin, focusPool, toggleBookmark, restart, cancelSession };
}
