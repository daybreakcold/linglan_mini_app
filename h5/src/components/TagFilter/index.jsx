import styles from './index.module.scss'

function TagFilter({ tags = [], activeIndex = 0, onChange }) {
  const handleClick = (index) => {
    if (onChange) {
      onChange(index, tags[index])
    }
  }

  return (
    <div className={styles.tagFilter}>
      <div className={styles.tagList}>
        {tags.map((tag, index) => (
          <div
            key={tag.key || index}
            className={`${styles.tagItem} ${index === activeIndex ? styles.active : ''}`}
            onClick={() => handleClick(index)}
          >
            {tag.name || tag}
          </div>
        ))}
      </div>
    </div>
  )
}

export default TagFilter
