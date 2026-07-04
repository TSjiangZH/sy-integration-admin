import request from '@/utils/request'

// 获取角色权限列表
export function fetchRoleAuthorities(roleId) {
  return request({
    url: `/v2/role-permission/get/${roleId}`,
    method: 'get'
  })
}

// 分配角色权限
export function assignRoleAuthorities(data) {
  return request({
    url: '/v2/role-permission/assign-role-permission',
    method: 'post',
    data
  })
}


