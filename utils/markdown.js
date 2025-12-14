/**
 * 简易 Markdown 解析工具
 * 将 Markdown 文本转换为微信小程序 rich-text 组件支持的 nodes 格式
 */

/**
 * 转义 HTML 特殊字符
 * @param {string} text 原始文本
 * @returns {string} 转义后的文本
 */
const escapeHtml = (text) => {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * 处理行内样式（加粗、斜体、代码、链接等）
 * @param {string} text 原始文本
 * @returns {string} 处理后的 HTML
 */
const processInlineStyles = (text) => {
  if (!text) return ''

  let result = escapeHtml(text)

  // 加粗 **text** 或 __text__
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  result = result.replace(/__(.+?)__/g, '<strong>$1</strong>')

  // 斜体 *text* 或 _text_（但不匹配已处理的加粗）
  result = result.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
  result = result.replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '<em>$1</em>')

  // 行内代码 `code`
  result = result.replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>')

  // 删除线 ~~text~~
  result = result.replace(/~~(.+?)~~/g, '<del>$1</del>')

  return result
}

/**
 * 将 Markdown 文本转换为 HTML 字符串
 * @param {string} markdown Markdown 文本
 * @returns {string} HTML 字符串
 */
const markdownToHtml = (markdown) => {
  if (!markdown) return ''

  const lines = markdown.split('\n')
  const htmlLines = []
  let inCodeBlock = false
  let codeBlockContent = []
  let inList = false
  let listItems = []
  let listType = 'ul'

  const flushList = () => {
    if (inList && listItems.length > 0) {
      htmlLines.push(`<${listType} class="md-list">${listItems.join('')}</${listType}>`)
      listItems = []
      inList = false
    }
  }

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]

    // 代码块处理
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // 结束代码块
        htmlLines.push(`<pre class="md-code-block"><code>${escapeHtml(codeBlockContent.join('\n'))}</code></pre>`)
        codeBlockContent = []
        inCodeBlock = false
      } else {
        // 开始代码块
        flushList()
        inCodeBlock = true
      }
      continue
    }

    if (inCodeBlock) {
      codeBlockContent.push(line)
      continue
    }

    // 空行
    if (line.trim() === '') {
      flushList()
      continue
    }

    // 标题 # ## ### #### ##### ######
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      flushList()
      const level = headingMatch[1].length
      const content = processInlineStyles(headingMatch[2])
      htmlLines.push(`<h${level} class="md-h${level}">${content}</h${level}>`)
      continue
    }

    // 无序列表 - 或 * 或 +
    const ulMatch = line.match(/^[\-\*\+]\s+(.+)$/)
    if (ulMatch) {
      if (!inList || listType !== 'ul') {
        flushList()
        inList = true
        listType = 'ul'
      }
      listItems.push(`<li>${processInlineStyles(ulMatch[1])}</li>`)
      continue
    }

    // 有序列表 1. 2. 3.
    const olMatch = line.match(/^\d+\.\s+(.+)$/)
    if (olMatch) {
      if (!inList || listType !== 'ol') {
        flushList()
        inList = true
        listType = 'ol'
      }
      listItems.push(`<li>${processInlineStyles(olMatch[1])}</li>`)
      continue
    }

    // 引用 >
    const blockquoteMatch = line.match(/^>\s*(.*)$/)
    if (blockquoteMatch) {
      flushList()
      htmlLines.push(`<blockquote class="md-blockquote">${processInlineStyles(blockquoteMatch[1])}</blockquote>`)
      continue
    }

    // 分隔线 --- 或 *** 或 ___
    if (/^(\-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      flushList()
      htmlLines.push('<hr class="md-hr"/>')
      continue
    }

    // 普通段落
    flushList()
    htmlLines.push(`<p class="md-p">${processInlineStyles(line)}</p>`)
  }

  // 处理未结束的代码块
  if (inCodeBlock && codeBlockContent.length > 0) {
    htmlLines.push(`<pre class="md-code-block"><code>${escapeHtml(codeBlockContent.join('\n'))}</code></pre>`)
  }

  // 处理未结束的列表
  flushList()

  return htmlLines.join('')
}

/**
 * 将 Markdown 转换为 rich-text 的 nodes 数组（HTML字符串形式）
 * @param {string} markdown Markdown 文本
 * @returns {string} HTML 字符串，可直接用于 rich-text 的 nodes 属性
 */
const parseMarkdown = (markdown) => {
  return markdownToHtml(markdown)
}

module.exports = {
  parseMarkdown,
  markdownToHtml,
  escapeHtml,
  processInlineStyles
}
