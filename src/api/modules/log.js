import request from '@/utils/request'

export function fetchBackendLogs(params) {
  return request({
    url: '/log-entry/list',
    method: 'get',
    params: {
      ...params,
      appType: 'backend'
    }
  })
}
