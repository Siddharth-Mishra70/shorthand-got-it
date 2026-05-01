import React from 'react';
import { RefreshCw, AlertTriangle, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught Error in Shorthandians Portal:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-red-100 overflow-hidden text-center p-10 animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-2">Wait! Something went wrong</h1>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed font-medium">
              We encountered an unexpected error while loading this module. Don't worry, your progress might still be recoverable.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full flex items-center justify-center space-x-2 bg-[#1e3a8a] hover:bg-blue-800 text-white font-black py-4 rounded-2xl transition-all shadow-xl active:scale-95"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Reload Application</span>
              </button>
              
              <button
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.href = '/';
                }}
                className="w-full flex items-center justify-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-4 rounded-2xl transition-all"
              >
                <Home className="w-4 h-4" />
                <span>Back to Home</span>
              </button>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">
                Shorthandians Security Layer Active
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
