import { useCallback } from 'react';
import { archiveSession, createSession, defaultFilters } from '../engine.ts';
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
  setPracticeSetup: Dispatch<SetStateAction<boolean>>;
  navigate: (page: Page) => void;
}

export function useLearningActions({
  active,
  setProgress,
  setConfirmation,
  setFilters,
  setPracticeSetup,
  navigate,
}: LearningActionsOptions) {
  const begin = useCallback(
    (session: Session) => {
      if (!session.questionIds.length) return;
      const start = () => {
        setPracticeSetup(false);
        setProgress((current) => ({ ...archiveSession(current, 'replaced'), session }));
        navigate('practice');
      };

      if (active && !active.finished) {
        setConfirmation({
          title: 'Start a new session?',
          body: 'This saves a read-only record of your current session and starts a new one. Checked-answer history and bookmarks stay saved.',
          action: 'Start session',
          run: start,
        });
      } else {
        start();
      }
    },
    [active, navigate, setConfirmation, setProgress, setPracticeSetup],
  );

  const chooseSession = useCallback(() => {
    setPracticeSetup(true);
    navigate('practice');
  }, [navigate, setPracticeSetup]);

  const focusPool = useCallback(
    (pool: Filters['pool']) => {
      setFilters({ ...defaultFilters, pool });
      chooseSession();
      window.setTimeout(
        () => document.getElementById('practice-builder')?.scrollIntoView({ behavior: 'smooth' }),
        50,
      );
    },
    [chooseSession, setFilters],
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
      body: active.archived
        ? 'The restarted session begins with no answers. Existing session records, checked-answer history, and bookmarks stay saved.'
        : 'Your current answers will be saved as a read-only record. The restarted session begins with no answers; checked-answer history and bookmarks stay saved.',
      action: 'Restart session',
      run: () => {
        const session = createSession(
          active.questionIds.map((id) => questionById[id]),
          active.title,
          active.questionIds.length,
          false,
        );
        session.options = active.options;
        setProgress((current) => ({ ...archiveSession(current, 'restarted'), session }));
        navigate('practice');
      },
    });
  }, [active, navigate, setConfirmation, setProgress]);

  const cancelSession = useCallback(() => {
    if (!active || active.finished) return;
    setConfirmation({
      title: 'Cancel this session?',
      body: 'This ends the current session and saves a read-only record, including unchecked selections. Checked-answer history and bookmarks stay saved.',
      action: 'End session',
      danger: true,
      run: () => {
        setProgress((current) => ({ ...archiveSession(current, 'cancelled'), session: null }));
        navigate('practice');
      },
    });
  }, [active, navigate, setConfirmation, setProgress]);

  return { begin, chooseSession, focusPool, toggleBookmark, restart, cancelSession };
}
