/**
 * 课程服务 - 课程相关 API
 */

import { get, post } from './request'

/**
 * 获取课程标签
 */
export const getCourseTags = () => {
  return get('/api/course-tags')
}

/**
 * 获取课程列表
 * @param {Object} params - { page, size, level, primaryTag, secondaryTag }
 */
export const getCourses = (params = {}) => {
  return get('/api/courses', {
    page: params.page || 1,
    size: params.size || 10,
    level: params.level || '',
    primaryTag: params.primaryTag || '',
    secondaryTag: params.secondaryTag || ''
  })
}

/**
 * 获取课程详情
 * @param {string|number} courseId - 课程 ID
 */
export const getCourseDetail = (courseId) => {
  return get(`/api/courses/${courseId}`)
}

/**
 * 报名课程
 * @param {string|number} courseId - 课程 ID
 */
export const enrollCourse = (courseId) => {
  return post(`/api/courses/${courseId}/enrollments`)
}

/**
 * 获取我的报名状态
 * @param {string|number} courseId - 课程 ID
 */
export const getEnrollmentStatus = (courseId) => {
  return get(`/api/courses/${courseId}/enrollments/me`)
}

/**
 * 更新学习进度
 * @param {string|number} courseId - 课程 ID
 * @param {number} progress - 进度 (0-100)
 */
export const updateProgress = (courseId, progress) => {
  return post(`/api/courses/${courseId}/enrollments/progress/update`, { progress })
}

export default {
  getCourseTags,
  getCourses,
  getCourseDetail,
  enrollCourse,
  getEnrollmentStatus,
  updateProgress
}
