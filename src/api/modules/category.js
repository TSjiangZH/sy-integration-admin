import request from '@/utils/request'

// 获取分类列表
export function getCategories() {
  return request({
    url: '/v1/category/list',
    method: 'get'
  })
}

export function fetchCategoryCount() {
  return request({
    url: '/v1/category/count',
    method: 'get'
  })
}

export function fetchCategoryDistribution() {
  return request({
    url: '/v1/category/distribution',
    method: 'get'
  })
}
