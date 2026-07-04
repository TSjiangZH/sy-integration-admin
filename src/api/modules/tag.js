import request from '@/utils/request'

// 获取标签列表
export function getTags() {
  return request({
    url: '/v1/tag/list',
    method: 'get'
  })
}

// 根据标签ID获取博客列表
export function getBlogsByTag(tagId) {
  return request({
    url: `/v1/blog/list/by-tag/${tagId}`,
    method: 'get'
  })
}

// 获取已删除标签列表
export function getDeletedTags() {
  return request({
    url: '/v1/tag/deleted',
    method: 'get'
  })
}

// 获取标签总数
export function fetchTagCount() {
  return request({
    url: '/v1/tag/count',
    method: 'get'
  })
}

// 创建标签
export function createTag(data) {
  return request({
    url: '/v1/tag',
    method: 'post',
    data
  })
}

// 更新标签
export function updateTag(data) {
  return request({
    url: '/v1/tag',
    method: 'put',
    data
  })
}

// 逻辑删除标签
export function deleteTag(id) {
  return request({
    url: `/v1/tag/delete/${id}`,
    method: 'delete'
  })
}

// 物理删除标签
export function physicalDeleteTag(id) {
  return request({
    url: `/v1/tag/${id}/physical`,
    method: 'delete'
  })
}

// 恢复标签
export function restoreTag(id) {
  return request({
    url: `/v1/tag/${id}/restore`,
    method: 'post'
  })
}

// 批量逻辑删除标签
export function batchDeleteTags(ids) {
  return request({
    url: '/v1/tag/batch',
    method: 'delete',
    data: ids
  })
}

// 批量物理删除标签
export function batchPhysicalDeleteTags(ids) {
  return request({
    url: '/v1/tag/batch/physical',
    method: 'delete',
    data: ids
  })
}

// 批量恢复标签
export function batchRestoreTags(ids) {
  return request({
    url: '/v1/tag/batch/restore',
    method: 'post',
    data: ids
  })
}

// 添加博客标签（原方法保留）
export function addBlogTags(data) {
  return request({
    url: '/v1/tag/add',
    method: 'post',
    data
  })
}
