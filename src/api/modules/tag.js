import request from '@/utils/request'

// 获取标签列表
export function getTags() {
  return request({
    url: '/v1/tag/list',
    method: 'get'
  })
}
export function fetchTagCount() {
  return request({
    url: '/v1/tag/count',
    method: 'get'
  })
}
