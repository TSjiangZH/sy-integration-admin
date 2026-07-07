import request from '@/utils/request'

export function getCurrentMetrics() {
  return request({
    url: '/v3/monitor/current',
    method: 'get'
  })
}

export function getHourlyStats(params) {
  return request({
    url: '/v3/monitor/hourly-stats',
    method: 'get',
    params
  })
}

export function getDailyStats(params) {
  return request({
    url: '/v3/monitor/daily-stats',
    method: 'get',
    params
  })
}

export function getOverviewStats(params) {
  return request({
    url: '/v3/monitor/overview',
    method: 'get',
    params
  })
}

export function saveRecord() {
  return request({
    url: '/v3/monitor/save',
    method: 'post'
  })
}

export function exportData(params) {
  return request({
    url: '/v3/monitor/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}