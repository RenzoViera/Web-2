import { Component } from 'react';
import { buildErrorReport } from '@/utils/errorReport';
import { ErrorReportView } from './ErrorReportView';

/**
 * Error boundary raíz: si algo falla al renderizar, muestra el aviso en vez de una pantalla en blanco.
 * @extends {Component<{ children: import('react').ReactNode }, { report: import('@/utils/errorReport').ErrorReport | null }>}
 */
export class ErrorBoundary extends Component {
  /** @param {{ children: import('react').ReactNode }} props */
  constructor(props) {
    super(props);
    this.state = { report: null };
  }

  /** @param {unknown} error */
  static getDerivedStateFromError(error) {
    return { report: buildErrorReport(error) };
  }

  /**
   * @param {unknown} error
   * @param {import('react').ErrorInfo} info
   */
  componentDidCatch(error, info) {
    this.setState({ report: buildErrorReport(error, { componentStack: info.componentStack }) });
  }

  render() {
    if (this.state.report) return <ErrorReportView report={this.state.report} variant="page" />;
    return this.props.children;
  }
}
