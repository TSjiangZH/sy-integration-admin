import request from '@/utils/request'

// 博客分配分类（单个）
export function addBlogCategory(blogId, categoryId) {
  return request({
    url: '/v2/category-blog/add',
    method: 'post',
    params: { blogId },
    data: [categoryId] // 兼容后端，传数组但只含一个元素
  })
}

// 博客移除某个分类
export function removeBlogCategory(blogId, categoryId) {
  return request({
    url: '/v2/category-blog/delete',
    method: 'delete',
    params: { blogId, categoryId }
  })
}

// 查询分类下所有博客
export function getBlogsByCategory(categoryId) {
  return request({
    url: `/v2/category-blog/category/${categoryId}/blogs`,
    method: 'get'
  })
}

// 查询博客所属分类
export function getCategoriesByBlog(blogId) {
  return request({
    url: `/v2/category-blog/blog/${blogId}/categories`,
    method: 'get'
  })
}
