import request from '@/utils/request'

export function fetchOperationLogs(params) {
  return request({
    url: '/v3/operation-log/list',
    method: 'get',
    params
  })
}

export function fetchOperationLogStats(params) {
  return request({
    url: '/v3/operation-log/stats',
    method: 'get',
    params
  })
}

export function deleteOperationLog(id) {
  return request({
    url: `/v3/operation-log/${id}`,
    method: 'delete'
  })
}