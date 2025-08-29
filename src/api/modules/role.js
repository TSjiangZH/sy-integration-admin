import request from '@/utils/request'

export function fetchRoleList(params) {
  return request({
    url: '/v3/role/list',
    method: 'get',
    params
  })
}

export function createRole(data) {
  return request({
    url: '/v3/role/create',
    method: 'post',
    data
  })
}

export function updateRole(data) {
  return request({
    url: '/v3/role/modify',
    method: 'put',
    data
  })
}

export function deleteRole(id) {
  return request({
    url: `/v3/role/delete/${id}`,
    method: 'delete'
  })
}

// 分配角色权限
export function assignRolePermission(data) {
  return request({
    url: '/v2/system/role/assign-role-permission',
    method: 'post',
    data
  })
}
