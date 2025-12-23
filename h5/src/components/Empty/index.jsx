import styles from './index.module.scss'

function Empty({ text = '暂无数据', image }) {
  return (
    <div className={styles.empty}>
      {image ? (
        <img src={image} alt="" className={styles.image} />
      ) : (
        <div className={styles.icon}>
          <svg viewBox="0 0 64 64" width="64" height="64">
            <circle cx="32" cy="32" r="30" fill="#f5f5f5" stroke="#e0e0e0" strokeWidth="2"/>
            <path d="M20 28 L28 36 L44 20" fill="none" stroke="#ccc" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}
      <span className={styles.text}>{text}</span>
    </div>
  )
}

export default Empty
