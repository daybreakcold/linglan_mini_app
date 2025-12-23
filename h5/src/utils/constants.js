// 常量定义

// API 基础地址
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://tmc.u9d.net/tmc'

// 标签映射 (英文 -> 中文)
export const TAG_NAME_MAP = {
  HEALTH: '健康养生',
  PHYSIQUE: '体质调理',
  SLEEP: '睡眠调理',
  VISION: '视力养护',
  MATERNITY: '母婴健康',
  LIFE: '生活方式'
}

// 获取标签中文名
export const getTagName = (key) => TAG_NAME_MAP[key] || key

// 默认头像
export const DEFAULT_AVATAR = '/images/default-avatar.png'

// 医生信息
export const DOCTOR_INFO = {
  name: '灵医生',
  avatar: '/images/avatar-doctor.svg'
}

// 分页默认值
export const PAGE_SIZE = 10
