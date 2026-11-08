import { useEffect, useState } from 'react';
import { api } from './api';

let metaCache = null;
export function useMeta() {
  const [meta, setMeta] = useState(metaCache);
  useEffect(() => {
    if (metaCache) return;
    api('/meta').then((m) => { metaCache = m; setMeta(m); }).catch(() => {});
  }, []);
  return meta;
}

export function useApi(path, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!path) return undefined;
    const ctl = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    api(path, { signal: ctl.signal })
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((error) => { if (error.name !== 'AbortError') setState({ data: null, error, loading: false }); });
    return () => ctl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, tick, ...deps]);
  return { ...state, reload: () => setTick((t) => t + 1) };
}

export function usePageTitle(title) {
  useEffect(() => { document.title = title ? `${title} · APEX` : 'APEX — Find the right AI tools for your business'; }, [title]);
}
