import { useState, useEffect, useCallback } from 'react'

export function useFetch(fetchFn, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const run = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchFn()
      setData(res.data)
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }, deps)

  useEffect(() => { run() }, [run])

  return { data, loading, error, refetch: run }
}
