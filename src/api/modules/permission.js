import request from '@/utils/request'

// 获取所有权限
export function getPermissions() {
  return request({
    url: '/v3/authority/list',
    method: 'get'
  })
}

// 添加新权限
export function addPermission(data) {
  return request({
    url: '/v3/authority/add',
    method: 'post',
    data
  })
}

// 更新权限
export function updatePermission(id, data) {
  return request({
    url: '/v3/authority/modify',
    method: 'put',
    data
  })
}

// 删除权限
export function deletePermission(id) {
  return request({
    url: `/v3/authority/${id}`,
    method: 'delete'
  })
}

// 分配角色权限
export function assignRolePermission(data) {
  return request({
    url: '/v2/authority/role/assign-role-authority',
    method: 'post',
    data
  })
}
