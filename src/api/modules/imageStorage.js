import request from '@/utils/request'

export function listStrategies() {
  return request({
    url: '/v1/image/storage/strategies',
    method: 'get'
  })
}

export function getStrategyConfig(type) {
  return request({
    url: `/v1/image/storage/strategies/${type}`,
    method: 'get'
  })
}

export function uploadImage(storageType, formData) {
  return request({
    url: '/v1/image/storage/upload',
    method: 'post',
    params: { storageType },
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export function batchUploadImages(storageType, formData) {
  return request({
    url: '/v1/image/storage/upload/batch',
    method: 'post',
    params: { storageType },
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export function uploadWithCustomName(storageType, formData, customName) {
  return request({
    url: '/v1/image/storage/upload/custom',
    method: 'post',
    params: { storageType, customName },
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export function deleteImage(storageType, imageId) {
  return request({
    url: '/v1/image/storage/delete',
    method: 'delete',
    params: { storageType, imageId }
  })
}