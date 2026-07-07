import request from '@/utils/request'

// 获取登录日志列表
export function fetchLoginLogs(params) {
  return request({
    url: '/v3/login-log/list',
    method: 'get',
    params
  })
}
