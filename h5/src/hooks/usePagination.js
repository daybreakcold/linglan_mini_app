/**
 * 分页加载 Hook
 */

import { useState, useCallback } from 'react'

/**
 * 分页数据加载
 * @param {Function} fetchFn - 请求函数，接收 { page, size, ...params } 返回 { items, hasNext }
 * @param {Object} options - 配置项
 */
export const usePagination = (fetchFn, options = {}) => {
  const { pageSize = 10, initialParams = {} } = options

  const [data, setData] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [params, setParams] = useState(initialParams)

  // 加载数据
  const loadData = useCallback(async (pageNum = 1, newParams = params) => {
    if (pageNum === 1) {
      setIsLoading(true)
    } else {
      setIsLoadingMore(true)
    }

    try {
      const res = await fetchFn({
        page: pageNum,
        size: pageSize,
        ...newParams
      })

      if (res.success && res.data) {
        const { items = [], hasNext = false } = res.data

        if (pageNum === 1) {
          setData(items)
        } else {
          setData(prev => [...prev, ...items])
        }

        setHasMore(hasNext)
        setPage(pageNum)
      }
    } catch (err) {
      console.error('加载数据失败:', err)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [fetchFn, pageSize, params])

  // 刷新（重新加载第一页）
  const refresh = useCallback((newParams) => {
    if (newParams) {
      setParams(newParams)
    }
    setData([])
    setPage(1)
    loadData(1, newParams || params)
  }, [loadData, params])

  // 加载更多
  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore) return
    loadData(page + 1)
  }, [hasMore, isLoadingMore, loadData, page])

  return {
    data,
    page,
    hasMore,
    isLoading,
    isLoadingMore,
    refresh,
    loadMore,
    setParams
  }
}

export default usePagination
