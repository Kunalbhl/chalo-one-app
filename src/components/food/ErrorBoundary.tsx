import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class FoodErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[FoodErrorBoundary] Uncaught error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 my-4 bg-rose-50 border border-rose-100 rounded-3xl text-center space-y-4 max-w-md mx-auto shadow-xs font-sans">
          <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto text-rose-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-black text-rose-950">Something went wrong</h3>
            <p className="text-xs text-rose-700 mt-1">We couldn't load this section. Try reloading the menu or check your network.</p>
          </div>
          <button
            type="button"
            onClick={this.handleRetry}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl cursor-pointer transition uppercase tracking-wider shadow-xs"
          >
            Retry ➔
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Request retry helper with exponential backoff
export async function retryRequest<T>(
  requestFn: () => Promise<T>,
  retries = 3,
  delayMs = 1000,
  backoffFactor = 2
): Promise<T> {
  try {
    return await requestFn();
  } catch (err) {
    if (retries <= 0) {
      throw err;
    }
    console.warn(`Request failed. Retrying in ${delayMs}ms... (Remaining retries: ${retries})`);
    await new Promise(resolve => setTimeout(resolve, delayMs));
    return retryRequest(requestFn, retries - 1, delayMs * backoffFactor, backoffFactor);
  }
}
