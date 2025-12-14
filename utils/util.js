/**
 * 工具函数库
 */

/**
 * 格式化时间
 * @param {Date} date - 日期对象
 * @returns {string} 格式化后的时间字符串
 */
const formatTime = (date) => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

/**
 * 格式化日期
 * @param {Date} date - 日期对象
 * @returns {string} 格式化后的日期字符串
 */
const formatDate = (date) => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  return `${[year, month, day].map(formatNumber).join('-')}`
}

/**
 * 数字补零
 * @param {number} n - 数字
 * @returns {string} 补零后的字符串
 */
const formatNumber = (n) => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

/**
 * 防抖函数
 * @param {Function} fn - 需要防抖的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
const debounce = (fn, delay = 300) => {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

/**
 * 节流函数
 * @param {Function} fn - 需要节流的函数
 * @param {number} interval - 间隔时间（毫秒）
 * @returns {Function} 节流后的函数
 */
const throttle = (fn, interval = 300) => {
  let lastTime = 0
  return function (...args) {
    const now = Date.now()
    if (now - lastTime >= interval) {
      lastTime = now
      fn.apply(this, args)
    }
  }
}

/**
 * 深拷贝
 * @param {*} obj - 需要拷贝的对象
 * @returns {*} 拷贝后的新对象
 */
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime())
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item))
  }
  
  if (obj instanceof Object) {
    const copy = {}
    Object.keys(obj).forEach(key => {
      copy[key] = deepClone(obj[key])
    })
    return copy
  }
  
  return obj
}

/**
 * 封装的请求方法
 * @param {Object} options - 请求配置
 * @returns {Promise} 请求Promise
 */
const request = (options) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'content-type': 'application/json',
        ...options.header
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          reject(res)
        }
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

/**
 * 显示加载提示
 * @param {string} title - 提示文字
 */
const showLoading = (title = '加载中...') => {
  wx.showLoading({
    title,
    mask: true
  })
}

/**
 * 隐藏加载提示
 */
const hideLoading = () => {
  wx.hideLoading()
}

/**
 * 显示轻提示
 * @param {string} title - 提示文字
 * @param {string} icon - 图标类型 success/error/loading/none
 * @param {number} duration - 显示时长
 */
const showToast = (title, icon = 'none', duration = 2000) => {
  wx.showToast({
    title,
    icon,
    duration
  })
}

/**
 * 显示模态对话框
 * @param {Object} options - 配置项
 * @returns {Promise} 返回 Promise
 */
const showModal = (options) => {
  return new Promise((resolve) => {
    wx.showModal({
      title: options.title || '提示',
      content: options.content || '',
      showCancel: options.showCancel !== false,
      cancelText: options.cancelText || '取消',
      confirmText: options.confirmText || '确定',
      success: (res) => {
        resolve(res.confirm)
      }
    })
  })
}

/**
 * 获取存储数据
 * @param {string} key - 键名
 * @returns {*} 存储的数据
 */
const getStorage = (key) => {
  try {
    return wx.getStorageSync(key)
  } catch (e) {
    console.error('获取存储失败:', e)
    return null
  }
}

/**
 * 设置存储数据
 * @param {string} key - 键名
 * @param {*} value - 值
 */
const setStorage = (key, value) => {
  try {
    wx.setStorageSync(key, value)
  } catch (e) {
    console.error('设置存储失败:', e)
  }
}

/**
 * 删除存储数据
 * @param {string} key - 键名
 */
const removeStorage = (key) => {
  try {
    wx.removeStorageSync(key)
  } catch (e) {
    console.error('删除存储失败:', e)
  }
}

module.exports = {
  formatTime,
  formatDate,
  formatNumber,
  debounce,
  throttle,
  deepClone,
  request,
  showLoading,
  hideLoading,
  showToast,
  showModal,
  getStorage,
  setStorage,
  removeStorage
}

