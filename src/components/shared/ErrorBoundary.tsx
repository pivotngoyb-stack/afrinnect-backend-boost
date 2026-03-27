import React from 'react';
import { AlertTriangle, RefreshCw, Home, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorId: null };
  }

  static getDerivedStateFromError(error) {
    const errorId = `ERR-${Date.now().toString(36).toUpperCase()}`;
    return { hasError: true, error, errorId };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`[ErrorBoundary] Error ID: ${this.state.errorId}`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorId: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted to-primary/5 p-4">
          <div className="max-w-md text-center bg-background rounded-2xl shadow-xl p-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-amber-500" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Oops! Something went wrong</h1>
            <p className="text-muted-foreground mb-6">
              We're sorry for the inconvenience. Our team has been notified and is working on a fix.
            </p>
            
            <div className="space-y-3">
              <Button onClick={this.handleRetry} className="w-full gap-2">
                <RefreshCw size={18} />
                Try Again
              </Button>
              
              <Button variant="outline" onClick={() => window.location.href = '/'} className="w-full gap-2">
                <Home size={18} />
                Go to Home
              </Button>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">
                Reference ID: {this.state.errorId}
              </p>
              <a 
                href={`mailto:Support@afrinnect.com?subject=App Error&body=Error ID: ${this.state.errorId}`}
                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
              >
                <Mail size={12} />
                Report this issue
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
