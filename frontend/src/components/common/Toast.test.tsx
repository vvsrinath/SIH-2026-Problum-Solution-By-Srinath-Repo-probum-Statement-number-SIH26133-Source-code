// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ToastProvider, useToast } from './Toast';

function Probe() {
  const { toast } = useToast();
  return (
    <button type="button" onClick={() => toast('Saved successfully')}>
      Show toast
    </button>
  );
}

describe('Toast', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('displays a toast when triggered', () => {
    render(
      <ToastProvider>
        <Probe />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Show toast' }));
    expect(screen.getByText('Saved successfully')).toBeInTheDocument();
  });

  it('auto-dismisses after 3.2s', () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <Probe />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Show toast' }));
    expect(screen.getByText('Saved successfully')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(3300);
    });
    expect(screen.queryByText('Saved successfully')).not.toBeInTheDocument();
  });

  it('dismisses immediately via the close button', () => {
    render(
      <ToastProvider>
        <Probe />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Show toast' }));
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));
    expect(screen.queryByText('Saved successfully')).not.toBeInTheDocument();
  });
});