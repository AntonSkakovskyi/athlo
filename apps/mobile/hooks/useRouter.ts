import { useRouter as useExpoRouter } from 'expo-router';
import { useRef, useCallback } from 'react';

const DEBOUNCE_MS = 500;

function hrefKey(href: Parameters<ReturnType<typeof useExpoRouter>['push']>[0]): string {
  if (typeof href === 'string') return href;
  return `${href.pathname ?? ''}${JSON.stringify(href.params ?? {})}`;
}

export function useRouter() {
  const router = useExpoRouter();
  const lastPush = useRef<{ key: string; at: number } | null>(null);

  const push: typeof router.push = useCallback(
    (...args) => {
      const key = hrefKey(args[0]);
      const now = Date.now();
      if (lastPush.current && lastPush.current.key === key && now - lastPush.current.at < DEBOUNCE_MS) return;
      lastPush.current = { key, at: now };
      return router.push(...args);
    },
    [router],
  );

  return { ...router, push };
}
