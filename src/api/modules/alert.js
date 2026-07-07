import request from '@/utils/request'

export function getActiveAlerts() {
  return request({
    url: '/v3/alert/active',
    method: 'get'
  })
}

export function getRecentAlerts() {
  return request({
    url: '/v3/alert/recent',
    method: 'get'
  })
}

export function getAllConfigs() {
  return request({
    url: '/v3/alert/configs',
    method: 'get'
  })
}

export function getConfigById(id) {
  return request({
    url: `/v3/alert/configs/${id}`,
    method: 'get'
  })
}

export function saveConfig(data) {
  return request({
    url: '/v3/alert/configs',
    method: 'post',
    data
  })
}

export function deleteConfig(id) {
  return request({
    url: `/v3/alert/configs/${id}`,
    method: 'delete'
  })
}

export function acknowledgeAlert(id) {
  return request({
    url: `/v3/alert/${id}/acknowledge`,
    method: 'post'
  })
}