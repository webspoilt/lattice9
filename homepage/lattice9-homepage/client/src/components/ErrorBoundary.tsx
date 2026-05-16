import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("LATTICE9_CRASH_REPORT:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-red-500 p-8 font-mono flex flex-col items-center justify-center text-center">
          <div className="text-4xl mb-4">⚠️ SYSTEM_CRASH</div>
          <div className="text-xs uppercase tracking-widest text-zinc-500 mb-8">Lattice9 Operational Failure Detected</div>
          <pre className="text-[10px] bg-zinc-900 p-4 border border-red-900/30 max-w-2xl overflow-auto text-left">
            {this.state.error?.stack}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            className="mt-8 px-6 py-2 border border-red-500 hover:bg-red-500 hover:text-black transition-all text-xs uppercase"
          >
            Restart Engine
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
