import { useEffect } from 'react';

const DEFAULT_TITLE = 'Xolos Explorer';

export function useDocumentTitle(title) {
  useEffect(() => {
    const nextTitle = title ? `${title} | ${DEFAULT_TITLE}` : DEFAULT_TITLE;
    document.title = nextTitle;
  }, [title]);
}
