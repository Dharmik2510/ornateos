import { useCallback, useEffect, useState } from 'react'

interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: Error | null
  reload: () => void
}

/**
 * Loads async data on mount (and whenever `deps` change), tracking loading and
 * error state. `reload()` re-runs the fetch on demand. Stale responses from a
 * superseded run are discarded.
 *
 * Centralises the load/loading/error pattern that every data page needs, so
 * pages stay declarative and the one unavoidable setState-on-mount lives here.
 */
export function useAsyncData<T>(
  fn: () => Promise<T>,
  deps: unknown[] = [],
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [nonce, setNonce] = useState(0)

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  useEffect(() => {
    let active = true
    void (async () => {
      setLoading(true)
      setError(null)
      try {
        const result = await fn()
        if (active) setData(result)
      } catch (e) {
        if (active) setError(e instanceof Error ? e : new Error(String(e)))
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce, ...deps])

  return { data, loading, error, reload }
}
