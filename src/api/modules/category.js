import request from '@/utils/request'

// 获取分类列表
export function getCategories() {
  return request({
    url: '/v1/category/list',
    method: 'get'
  })
}

// 获取已删除分类列表
export function getDeletedCategories() {
  return request({
    url: '/v1/category/list/del',
    method: 'get'
  })
}

// 获取分类总数
export function fetchCategoryCount() {
  return request({
    url: '/v1/category/count',
    method: 'get'
  })
}

// 获取分类分布
export function fetchCategoryDistribution() {
  return request({
    url: '/v1/category/distribution',
    method: 'get'
  })
}

// 创建分类
export function createCategory(data) {
  return request({
    url: '/v1/category',
    method: 'post',
    data
  })
}

// 更新分类
export function updateCategory(data) {
  return request({
    url: '/v1/category',
    method: 'put',
    data
  })
}

// 逻辑删除分类
export function deleteCategory(id) {
  return request({
    url: `/v1/category/delete/${id}`,
    method: 'delete'
  })
}

// 物理删除分类
export function physicalDeleteCategory(id) {
  return request({
    url: `/v1/category/physical-delete/${id}`,
    method: 'delete'
  })
}

// 恢复分类
export function restoreCategory(id) {
  return request({
    url: `/v1/category/restore/${id}`,
    method: 'post'
  })
}

// 批量逻辑删除分类
export function batchDeleteCategories(ids) {
  return request({
    url: '/v1/category/batch-delete',
    method: 'delete',
    data: ids
  })
}

// 批量物理删除分类
export function batchPhysicalDeleteCategories(ids) {
  return request({
    url: '/v1/category/batch-physical-delete',
    method: 'delete',
    data: ids
  })
}

// 批量恢复分类
export function batchRestoreCategories(ids) {
  return request({
    url: '/v1/category/batch-restore',
    method: 'post',
    data: ids
  })
}
