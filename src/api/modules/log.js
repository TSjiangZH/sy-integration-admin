import request from '@/utils/request'

export function fetchBackendLogs(params) {
  return request({
    url: '/v3/log-entry/list',
    method: 'get',
    params: {
      ...params,
      appType: 'backend'
    }
  })
}

export function fetchLogStats(params) {
  return request({
    url: '/v3/log-entry/stats',
    method: 'get',
    params
  })
}

export function deleteLog(id) {
  return request({
    url: `/v3/log-entry/${id}`,
    method: 'delete'
  })
}

export function clearLogs(params) {
  return request({
    url: '/v3/log-entry/clear',
    method: 'delete',
    params
  })
}
