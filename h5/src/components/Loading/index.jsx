import styles from './index.module.scss'

function Loading({ text = '加载中...' }) {
  return (
    <div className={styles.loading}>
      <div className={styles.spinner}></div>
      <span className={styles.text}>{text}</span>
    </div>
  )
}

export default Loading
