// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useAsync } from './useAsync';

describe('useAsync', () => {
  it('loads data on mount', async () => {
    const { result } = renderHook(() => useAsync(() => Promise.resolve({ ok: true }), []));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ ok: true });
    expect(result.current.error).toBeNull();
  });

  it('captures an error from a rejected promise', async () => {
    const { result } = renderHook(() =>
      useAsync(() => Promise.reject(new Error('network down')), []),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error?.message).toBe('network down');
    expect(result.current.data).toBeNull();
  });

  it('reload() re-runs the loader', async () => {
    let calls = 0;
    const { result } = renderHook(() =>
      useAsync(() => Promise.resolve(calls++), []),
    );
    await waitFor(() => expect(result.current.data).toBe(0));
    act(() => result.current.reload());
    await waitFor(() => expect(result.current.data).toBe(1));
  });
});