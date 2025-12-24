// 格式化工具函数

/**
 * 格式化日期
 * @param {string|Date} date 日期
 * @param {string} format 格式 (默认 YYYY-MM-DD)
 * 支持的格式：YYYY, MM, M, DD, D, HH, hh, mm, ss, A
 */
export const formatDate = (date, format = 'YYYY-MM-DD') => {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''

  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const day = d.getDate()
  const hour24 = d.getHours()
  const hour12 = hour24 % 12 || 12
  const minute = d.getMinutes()
  const second = d.getSeconds()
  const ampm = hour24 >= 12 ? 'PM' : 'AM'

  return format
    .replace('YYYY', String(year))
    .replace('MM', String(month).padStart(2, '0'))
    .replace('M', String(month))
    .replace('DD', String(day).padStart(2, '0'))
    .replace('D', String(day))
    .replace('HH', String(hour24).padStart(2, '0'))
    .replace('hh', String(hour12).padStart(2, '0'))
    .replace('mm', String(minute).padStart(2, '0'))
    .replace('ss', String(second).padStart(2, '0'))
    .replace('A', ampm)
}

/**
 * 格式化相对时间
 * @param {string|Date} date 日期
 */
export const formatRelativeTime = (date) => {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''

  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 30) {
    return formatDate(date)
  } else if (days > 0) {
    return `${days}天前`
  } else if (hours > 0) {
    return `${hours}小时前`
  } else if (minutes > 0) {
    return `${minutes}分钟前`
  } else {
    return '刚刚'
  }
}

/**
 * 格式化数字 (超过1万显示为 x.x万)
 * @param {number} num 数字
 */
export const formatNumber = (num) => {
  if (!num || num < 10000) return String(num || 0)
  return (num / 10000).toFixed(1) + '万'
}
