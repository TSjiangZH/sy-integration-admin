import request from '@/utils/request'

export function fetchRolePermissions(roleId) {
  return request({
    url: `/v2/role-permission/get/${roleId}`,
    method: 'get'
  })
}

export function assignRolePermissions(data) {
  return request({
    url: '/v2/role-permission/assign-role-permission',
    method: 'post',
    data
  })
}