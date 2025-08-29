import request from '@/utils/request'
import { getRefreshToken } from '@/utils/auth'

// 刷新令牌
export function refreshToken() {
  return request({
    url: '/auth/refresh',
    method: 'post',
    data: {
      refreshToken: getRefreshToken()
    }
  })
}

export function login(data) {
  return request({
    url: '/auth/login',
    method: 'post',
    data
  })
}

export function getInfo() {
  return request({
    url: '/auth/info',
    method: 'get'
  })
}

export function logout() {
  return request({
    url: '/auth/logout',
    method: 'post'
  })
}

export function fetchUserList(params) {
  return request({
    url: '/v3/user/list',
    method: 'get',
    params
  })
}

export function createUser(data) {
  return request({
    url: '/v3/user/add',
    method: 'post',
    data
  })
}

export function updateUser(data) {
  // 兜底删除 deleted 字段，防止类型错误
  const submitData = { ...data }
  delete submitData.deleted
  return request({
    url: '/v3/user/edit',
    method: 'put',
    data: submitData
  })
}

export function deleteUser(id) {
  return request({
    url: `/v3/user/delete/${id}`,
    method: 'delete'
  })
}

export function assignUserRole(data) {
  return request({
    url: '/v3/user/assign-role',
    method: 'post',
    data
  })
}

export function updateProfile(data) {
  return request({
    url: '/v3/user/edit-profile',
    method: 'put',
    data
  })
}

export function getUserDetail(id) {
  return request({
    url: `/v3/user/get/${id}`,
    method: 'get'
  })
}

// 逻辑删除
export function logicDeleteUser(id) {
  return request({
    url: `/v3/user/logic-delete/${id}`,
    method: 'delete'
  })
}

// 物理删除（彻底删除，需有权限）
export function realDeleteUser(id, perms) {
  return request({
    url: `/v3/user/real-delete/${id}`,
    method: 'delete',
    headers: {
      'X-User-Permissions': perms
    }
  })
}
