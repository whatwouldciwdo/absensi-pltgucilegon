import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React component tree:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          background: '#0a0e1a',
          color: '#f1f5f9',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{
            maxWidth: '600px',
            width: '100%',
            background: 'rgba(23, 30, 49, 0.85)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '16px',
            padding: '2rem',
            backdropFilter: 'blur(16px)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
                fontSize: '20px'
              }}>
                ⚠️
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                Terjadi Kesalahan Aplikasi
              </h2>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1rem', lineHeight: 1.5 }}>
              Aplikasi mengalami kendala saat memuat komponen. Silakan periksa pesan kesalahan di bawah ini:
            </p>
            <pre style={{
              background: '#050811',
              padding: '1rem',
              borderRadius: '8px',
              color: '#f87171',
              fontSize: '0.75rem',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              marginBottom: '1.5rem',
              border: '1px solid rgba(255,255,255,0.06)'
            }}>
              {this.state.error?.toString()}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                color: '#fff',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Muat Ulang Halaman
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
