import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import styles from './index.module.scss'

function MarkdownRenderer({ content }) {
  if (!content) return null

  return (
    <div className={styles.markdown}>
      <ReactMarkdown rehypePlugins={[rehypeRaw]}>
        {content}
      </ReactMarkdown>
    </div>
  )
}

export default MarkdownRenderer
