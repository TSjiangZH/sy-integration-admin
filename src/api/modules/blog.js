import request from '@/utils/request'

export function fetchBlogList(params) {
  return request({
    url: '/v1/blog/list',
    method: 'get',
    params
  })
}

export function getBlogDetail(id) {
  return request({
    url: `/v1/blog/get/${id}`,
    method: 'get'
  })
}

export function createBlog(data) {
  return request({
    url: '/v1/blog',
    method: 'post',
    data
  })
}

export function updateBlog(data) {
  return request({
    url: '/v1/blog',
    method: 'put',
    data
  })
}

export function deleteBlog(id) {
  return request({
    url: `/v1/blog/delete/${id}`,
    method: 'delete'
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

export function fetchBlogStats() {
  return request({
    url: '/v1/blog/stats',
    method: 'get'
  })
}

export function fetchBlogTrend(params) {
  return request({
    url: '/v1/blog/trend',
    method: 'get',
    params
  })
}
