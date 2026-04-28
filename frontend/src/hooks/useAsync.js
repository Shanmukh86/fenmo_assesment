import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Hook to generate and persist an idempotency key
 * Prevents duplicate submissions on page refresh or retry
 */
export function useIdempotencyKey(namespace = 'expense') {
  const keyRef = useRef(null);

  useEffect(() => {
    // Try to load from localStorage first (persists on page refresh)
    const storedKey = localStorage.getItem(`idempotency_${namespace}`);

    if (storedKey) {
      keyRef.current = storedKey;
    } else {
      // Generate a new key if none exists
      const newKey = `${namespace}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      keyRef.current = newKey;
      // Store in localStorage for the session
      localStorage.setItem(`idempotency_${namespace}`, newKey);
    }
  }, [namespace]);

  const getKey = () => keyRef.current;

  const clearKey = () => {
    localStorage.removeItem(`idempotency_${namespace}`);
    keyRef.current = null;
  };

  return { getKey, clearKey };
}

/**
 * Hook for managing the state of an async operation
 * Handles loading, error, and success states
 */
export function useAsync(asyncFunction, immediate = true) {
  const [state, setState] = useState({
    status: 'idle',
    data: null,
    error: null,
  });

  const execute = useCallback(
    async (...args) => {
      setState({ status: 'pending', data: null, error: null });
      try {
        const response = await asyncFunction(...args);
        setState({ status: 'success', data: response, error: null });
        return response;
      } catch (error) {
        setState({ status: 'error', data: null, error });
        throw error;
      }
    },
    [asyncFunction]
  );

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { ...state, execute };
}
