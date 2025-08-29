import request from '@/utils/request'
export function getRoutes() {
  return request({
    url: '/v2/system/menu/get/routes',
    method: 'get'
  })
}
