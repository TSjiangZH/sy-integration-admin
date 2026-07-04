import request from '@/utils/request'
import { get } from 'sortablejs'
// 博客列表
export function fetchBlogList(params) {
  return request({
    url: '/v1/blog/list',
    method: 'get',
    params
  })
}
// 博客详情
export function getBlogDetail(id) {
  return request({
    url: `/v1/blog/detail/${id}`,
    method: 'get'
  })
}
// 创建博客
export function createBlog(data) {
  return request({
    url: '/v1/blog/create',
    method: 'post',
    data
  })
}
// 更新博客
export function updateBlog(data) {
  return request({
    url: `/v1/blog/update/${data.id}`,
    method: 'put',
    data
  })
}
// 删除博客
export function deleteBlog(id) {
  return request({
    url: `/v1/blog/delete/${id}`,
    method: 'delete'
  })
}

// 获取已删除博客列表
export function fetchDeletedBlogList(params) {
  return request({
    url: '/v1/blog/deleted/list',
    method: 'get',
    params
  })
}

// 物理删除博客
export function physicalDeleteBlog(id) {
  return request({
    url: `/v1/blog/physical-delete/${id}`,
    method: 'delete'
  })
}

// 恢复博客
export function recoverBlog(id) {
  return request({
    url: `/v1/blog/recover/${id}`,
    method: 'put'
  })
}

// 批量物理删除博客
export function batchPhysicalDeleteBlogs(ids) {
  return request({
    url: '/v1/blog/batch-physical-delete',
    method: 'delete',
    data: ids
  })
}

// 置顶博客
export function setTopBlog(id, isTop) {
  return request({
    url: `/v1/blog/top/${id}`,
    method: 'post',
    data: { isTop }
  })
}

// 推荐博客
export function setRecommendBlog(id, isRecommend) {
  return request({
    url: `/v1/blog/recommend/${id}`,
    method: 'post',
    data: { isRecommend }
  })
}
// 博客统计
export function fetchBlogStats() {
  return request({
    url: '/v1/blog/stats',
    method: 'get'
  })
}
// 博客趋势
export function fetchBlogTrend(params) {
  return request({
    url: '/v1/blog/trend',
    method: 'get',
    params
  })
}



export function incrementBlogViews(id) {
  return request({
    url: `/v1/blog/views/${id}`,
    method: 'post'
  })
}


export function likeBlog(id) {
  return request({
    url: `/v1/blog/like/${id}`,
    method: 'post'
  })
}


export function getComment(id) {
  return request({
    url: `/v1/blog/comment/get/${id}`,
    method: 'get'
  })
}

export function addComment(data) {
  return request({
    url: '/v1/blog/comment/add',
    method: 'post',
    data
  })
}

// 获取草稿博客列表
export function fetchDraftList(params) {
  return request({
    url: '/v1/blog/draft/list',
    method: 'get',
    params
  })
}

// 获取待审核博客列表
export function fetchReviewList(params) {
  return request({
    url: '/v1/blog/review/list',
    method: 'get',
    params
  })
}

// 提交审核
export function submitReview(id) {
  return request({
    url: `/v1/blog/review/submit/${id}`,
    method: 'post'
  })
}

// 审核通过
export function approveReview(id) {
  return request({
    url: `/v1/blog/review/approve/${id}`,
    method: 'post'
  })
}

// 审核不通过
export function rejectReview(id, reason) {
  return request({
    url: `/v1/blog/review/reject/${id}`,
    method: 'post',
    data: { reason }
  })
}
