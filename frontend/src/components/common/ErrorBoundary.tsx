import React from 'react';
import { AlertTriangleIcon, RefreshCwIcon } from 'lucide-react';
import { Button } from './Button';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <AlertTriangleIcon className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-navy">Something went wrong</h2>
          <p className="mt-2 max-w-sm text-sm text-ink-500">
            An unexpected error occurred. You can try reloading this page or return to the dashboard.
          </p>
          <p className="mt-3 max-w-md rounded-card border border-red-200 bg-red-50 p-3 text-left text-2xs leading-5 text-red-700">
            {this.state.error.message}
          </p>
          <div className="mt-5 flex gap-2">
            <Button onClick={this.handleReset} variant="secondary">
              <RefreshCwIcon className="h-3.5 w-3.5" />
              Try again
            </Button>
            <Button to="/">Go home</Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
