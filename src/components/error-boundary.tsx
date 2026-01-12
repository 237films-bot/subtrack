'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch and handle React errors gracefully
 * Prevents the entire app from crashing when a component throws an error
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // In production, you could send this to an error reporting service like Sentry
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-6 text-center">
            <div className="flex justify-center">
              <div className="size-20 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="size-10 text-red-500" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Oups ! Une erreur est survenue</h1>
              <p className="text-muted-foreground">
                Désolé, quelque chose s&apos;est mal passé. Veuillez réessayer ou recharger la page.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="p-4 bg-muted rounded-lg text-left">
                <p className="text-sm font-mono text-red-500 break-all">
                  {this.state.error.toString()}
                </p>
                {this.state.error.stack && (
                  <details className="mt-2">
                    <summary className="text-xs cursor-pointer text-muted-foreground">
                      Stack trace
                    </summary>
                    <pre className="text-xs mt-2 overflow-auto max-h-40">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Button onClick={this.handleReset} variant="outline">
                Réessayer
              </Button>
              <Button onClick={this.handleReload}>
                <RefreshCcw className="size-4 mr-2" />
                Recharger la page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
