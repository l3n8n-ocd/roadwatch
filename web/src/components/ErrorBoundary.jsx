import { Component } from 'react';
import ServerError from '../pages/public/ServerError';

// Catches render errors (and 5xx errors re-thrown by useServerError) and shows the 500 page (W12).
// resetKey: the current path; moving to another page clears the error.
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // The browser console is the only log on the client side.
    console.error('RoadWatch page error', error, info?.componentStack);
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    if (this.state.error) return <ServerError />;
    return this.props.children;
  }
}
