import { useCallback, useEffect, useState } from 'react';

export type Page = 'dashboard' | 'practice' | 'progress' | 'settings';

function currentPage(): Page {
  const page = location.hash.replace('#/', '');
  return ['dashboard', 'practice', 'progress', 'settings'].includes(page)
    ? (page as Page)
    : 'dashboard';
}

export function useHashNavigation() {
  const [page, setPage] = useState<Page>(currentPage);

  useEffect(() => {
    const onHashChange = () => setPage(currentPage());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    document.title = `${page[0].toUpperCase() + page.slice(1)} · Design Pattern Lab`;
  }, [page]);

  const navigate = useCallback((next: Page) => {
    location.hash = `/${next}`;
    setPage(next);
    window.scrollTo({ top: 0 });
  }, []);

  return { page, navigate };
}
