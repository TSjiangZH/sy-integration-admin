// 博客分配标签（批量）
import request from '@/utils/request'

export function addBlogTags(blogId, tagIds) {
  return request({
    url: '/v2/tag-blog/add',
    method: 'post',
    data: { blogId, tagIds }
  })
}
// 博客移除某个标签
export function removeBlogTag(blogId, tagId) {
  return request({
    url: '/v2/tag-blog/delete',
    method: 'delete',
    params: { blogId, tagId }
  })
}
