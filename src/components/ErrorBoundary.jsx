import React from "react";
import Btn from "./Btn.jsx";
import Card from "./Card.jsx";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error) {
    this.setState({ error });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-surface">
          <Card className="w-full max-w-xl text-center">
            <h2 className="font-headline text-2xl font-bold text-on-surface mb-3">Something went wrong</h2>
            <code className="block p-3 rounded-lg bg-surface-container text-left text-sm text-on-surface-variant overflow-auto mb-4">
              {this.state.error?.message || "Unknown error"}
            </code>
            <Btn onClick={() => window.location.reload()}>Reload page</Btn>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
