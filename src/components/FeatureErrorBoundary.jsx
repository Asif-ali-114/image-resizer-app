import React from "react";
import Btn from "./Btn.jsx";
import Card from "./Card.jsx";

export default class FeatureErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    window.console.error("Feature render error:", error, errorInfo?.componentStack || "");
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Card>
          <div className="space-y-3">
            <h3 className="font-headline text-xl font-bold text-on-surface">Something went wrong</h3>
            <p className="text-sm text-error">{this.state.error?.message || "Unknown runtime error"}</p>
            <p className="text-xs text-on-surface-variant">If this persists, try a different image or format.</p>
            <Btn onClick={this.reset} aria-label="Try loading feature again">Try Again</Btn>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}
