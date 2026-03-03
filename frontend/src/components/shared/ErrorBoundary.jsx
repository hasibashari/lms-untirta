import { Component } from 'react';

/**
 * ErrorBoundary — Catches unhandled rendering errors and shows a fallback UI.
 * Wraps the entire route tree so crashed pages don't blank the screen.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // TODO: integrate with external error-tracking service (e.g. Sentry)
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 p-6">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800">
              Terjadi Kesalahan
            </h2>
            <p className="text-sm text-gray-500">
              Halaman mengalami error yang tidak terduga. Silakan coba muat ulang halaman.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre className="mt-2 p-3 bg-gray-100 rounded text-xs text-left text-red-700 overflow-auto max-h-40">
                {this.state.error.toString()}
              </pre>
            )}
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Coba Lagi
              </button>
              <button
                onClick={() => window.location.replace('/')}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Ke Beranda
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
