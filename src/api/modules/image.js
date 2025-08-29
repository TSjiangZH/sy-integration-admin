import request from '@/utils/request'

// 获取图片列表
export function fetchImageList(params) {
  return request({
    url: '/v1/image/list',
    method: 'get',
    params
  })
}

// 获取云端图片列表
export function fetchCloudImageList(params) {
  return request({
    url: '/v1/image/list/imagehub',
    method: 'get',
    params
  })
}

// 本地上传
export function uploadLocalImage(formData) {
  return request({
    url: '/v1/image/upload/local',
    method: 'post',
    data: formData
  })
}

// 云存储上传
export function uploadCloudImage(formData) {
  return request({
    url: '/v1/image/upload/cloud',
    method: 'post',
    data: formData
  })
}

// 删除图片
export function deleteImage(id, logicalDelete = false) {
  return request({
    url: `/v1/image/${id}`,
    method: 'delete',
    params: {
      logicalDelete
    }
  })
}

// 编辑图片
export function updateImage(id, data) {
  return request({
    url: `/v1/image/${id}`,
    method: 'put',
    data
  })
}
