import { Component } from 'react'
import styles from './index.module.scss'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.errorPage}>
          <div className={styles.icon}>
            <svg viewBox="0 0 64 64" width="64" height="64">
              <circle cx="32" cy="32" r="30" fill="#fff0f0" stroke="#ff6b6b" strokeWidth="2"/>
              <path d="M32 18 L32 38" stroke="#ff6b6b" strokeWidth="4" strokeLinecap="round"/>
              <circle cx="32" cy="46" r="3" fill="#ff6b6b"/>
            </svg>
          </div>
          <h2 className={styles.title}>页面出错了</h2>
          <p className={styles.message}>抱歉，页面加载出现问题</p>
          <button className={styles.retryBtn} onClick={this.handleRetry}>
            重新加载
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
