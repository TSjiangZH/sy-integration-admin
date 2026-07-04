import request from '@/utils/request'

// 获取所有权限
export function getPermissions() {
  return request({
    url: '/v3/permission/list',
    method: 'get'
  })
}

// 添加新权限
export function addPermission(data) {
  return request({
    url: '/v3/permission/add',
    method: 'post',
    data
  })
}

// 更新权限
export function updatePermission(id, data) {
  return request({
    url: '/v3/permission/modify',
    method: 'put',
    data
  })
}

// 删除权限
export function deletePermission(id) {
  return request({
    url: `/v3/permission/${id}`,
    method: 'delete'
  })
}

// 分配角色权限
export function assignRolePermission(data) {
  return request({
    url: '/v2/role-permission/assign-role-permission',
    method: 'post',
    data
  })
}
