/**
 * ============================================
 * 【权限控制模块】前端用户状态管理
 * ============================================
 * 
 * 该模块负责管理用户认证和权限相关的状态，包括：
 * 1. 用户登录/登出状态管理
 * 2. 用户角色（roles）管理
 * 3. 用户权限（perms）管理
 * 4. Token生命周期管理
 * 
 * 权限数据结构：
 * - roles: 角色数组，如 ['admin', 'user', 'editor']
 * - perms: 权限编码数组，如 ['manage:user:add', 'manage:user:delete']
 * 
 * 权限数据标准化：
 * - 角色转换为小写以保持一致性
 * - 支持多种后端返回格式（roles/role, perms/permission/permissions/authorities）
 * - 空角色默认为 'guest'
 * 
 * @author security-module
 */

import { login, logout, getInfo, refreshToken } from '@/api/modules/user'
import { getToken, setToken, removeToken, setRefreshToken, clearAuthTokens } from '@/utils/auth'
import router, { resetRouter } from '@/router'

const getDefaultState = () => {
  return {
    token: getToken(),
    name: '',
    avatar: '',
    introduction: '',
    /** 【权限控制】用户角色列表 */
    roles: [],
    /** 【权限控制】用户权限编码列表 */
    perms: [],
    id: null,
    email: '',
    phone: '',
    userInfo: null, // 存储完整用户信息
    lastUpdateTime: null // 记录最后更新时间
  }
}

const state = getDefaultState()

const mutations = {
  RESET_STATE: (state) => {
    Object.assign(state, getDefaultState())
  },
  SET_TOKEN: (state, token) => {
    state.token = token
  },
  SET_INTRODUCTION: (state, introduction) => {
    state.introduction = introduction
  },
  SET_NAME: (state, name) => {
    state.name = name
  },
  SET_AVATAR: (state, avatar) => {
    state.avatar = avatar
  },
  SET_ROLES: (state, roles) => {
    // 确保roles始终是数组
    state.roles = Array.isArray(roles) ? roles : []
  },
  SET_PERMS: (state, perms) => {
    // 确保perms始终是数组
    state.perms = Array.isArray(perms) ? perms : []
  },
  SET_ID: (state, id) => {
    state.id = id
  },
  SET_EMAIL: (state, email) => {
    state.email = email
  },
  SET_PHONE: (state, phone) => {
    state.phone = phone
  },
  SET_USER_INFO: (state, userInfo) => {
    state.userInfo = userInfo
  },
  SET_LAST_UPDATE_TIME: (state) => {
    state.lastUpdateTime = new Date().getTime()
  }
}

const actions = {
  // user login
  login({ commit }, userInfo) {
    const { username, password } = userInfo
    return new Promise((resolve, reject) => {
      login({ username: username.trim(), password: password }).then(response => {
        const { data } = response
        const { token, refreshToken } = data
        setToken(token)
        setRefreshToken(refreshToken)
        commit('SET_TOKEN', token)
        resolve()
      }).catch(error => {
        reject(error)
      })
    })
  },

  // 刷新令牌
  refreshToken({ commit }) {
    return new Promise((resolve, reject) => {
      console.log('开始刷新令牌...')
      refreshToken().then(response => {
        console.log('刷新令牌成功:', response)
        const { token } = response
        setToken(token)
        commit('SET_TOKEN', token)
        resolve()
      }).catch(error => {
        console.error('刷新令牌失败:', error)
        // 不在这里处理重定向，由request.js统一处理
        reject(error)
      })
    })
  },

  // get user info
  getInfo({ commit, state }) {
    return new Promise((resolve, reject) => {
      try {
        console.log('开始获取用户信息...')
        getInfo().then(response => {
          console.log('获取用户信息响应:', response)
          
          // 防御性检查
          if (!response || typeof response !== 'object') {
            return reject(new Error('无效的响应数据格式'))
          }
          
          const { data } = response

          if (!data || typeof data !== 'object') {
            return reject(new Error('验证失败，请重新登录'))
          }

          // 提取用户信息，支持不同的数据结构
          const userId = data.userId || data.id || null
          const name = data.name || data.username || data.nickname || ''
          const avatar = data.avatar || ''
          const remark = data.remark || data.introduction || ''
          const email = data.email || ''
          const phone = data.phone || ''
          
          // 标准化角色和权限数据
          const roles = normalizeArray(data.roles || data.role || [])
          const perms = normalizeArray(data.perms || data.permission || data.authority || data.permissions || data.authorities || [])

          // 过滤空角色并转小写，兼容后端大写返回
          const validRoles = roles
            .filter(r => r && typeof r === 'string' && r.trim())
            .map(r => r.toLowerCase())
          
          // 如果没有有效角色，设置为guest
          if (validRoles.length === 0) {
            validRoles.push('guest')
            console.warn('用户没有指定角色，已设置为guest角色')
          }

          // 过滤空权限
          const validPerms = perms.filter(p => p && typeof p === 'string' && p.trim())

          // 更新状态
          commit('SET_ROLES', validRoles)
          commit('SET_PERMS', validPerms)
          commit('SET_NAME', name)
          commit('SET_AVATAR', avatar)
          commit('SET_INTRODUCTION', remark)
          commit('SET_ID', userId)
          commit('SET_EMAIL', email)
          commit('SET_PHONE', phone)
          commit('SET_USER_INFO', data) // 保存完整用户信息
          commit('SET_LAST_UPDATE_TIME') // 更新时间戳

          // 返回标准化的用户数据
          const resultData = { 
            ...data, 
            roles: validRoles, 
            perms: validPerms,
            id: userId // 添加id字段作为userId的别名，提高兼容性
          }
          
          console.log('处理后返回的用户数据:', { roles: validRoles, perms: validPerms })
          resolve(resultData)
        }).catch(error => {
          console.error('获取用户信息失败:', error)
          
          // 标准化错误信息
          let errorMessage = '获取用户信息失败'
          if (error.response && error.response.status === 401) {
            errorMessage = '[401] 未授权访问，请重新登录'
            error.is401 = true
          } else if (error.message) {
            errorMessage = error.message
          }
          
          const enhancedError = new Error(errorMessage)
          if (error.response) {
            enhancedError.status = error.response.status
          }
          
          reject(enhancedError)
        })
      } catch (error) {
        // 捕获任何同步错误
        console.error('处理用户信息时发生异常:', error)
        reject(new Error('处理用户信息失败'))
      }
    })
  },

  // user logout
  logout({ commit, state, dispatch }) {
    return new Promise((resolve, reject) => {
      console.log('开始登出流程...')
      
      // 即使后端登出失败，也要执行本地清理
      const cleanLocalState = () => {
        console.log('执行本地状态清理...')
        commit('SET_TOKEN', '')
        commit('SET_ROLES', [])
        commit('SET_PERMS', [])
        clearAuthTokens()
        
        // 重置路由
        try {
          resetRouter()
          console.log('路由已重置')
        } catch (resetError) {
          console.error('重置路由失败:', resetError)
        }

        // 清除标签页缓存
        try {
          dispatch('tagsView/delAllViews', null, { root: true })
          console.log('标签页缓存已清除')
        } catch (tagsError) {
          console.error('清除标签页失败:', tagsError)
        }
      }
      
      // 调用后端登出接口
      logout(state.token).then(() => {
        console.log('后端登出成功')
        cleanLocalState()
        resolve()
      }).catch(error => {
        console.error('后端登出失败，但仍执行本地清理:', error)
        // 即使后端登出失败，也要清理本地状态
        cleanLocalState()
        resolve() // 登出流程成功完成，无论后端是否报错
      })
    })
  },

  // remove token
  resetToken({ commit }) {
    return new Promise(resolve => {
      try {
        console.log('执行令牌重置...')
        removeToken() // must remove token first
        commit('RESET_STATE')
        console.log('令牌和用户信息已清除')
        resolve()
      } catch (error) {
        console.error('重置Token失败:', error)
        // 即使出错也尝试继续，避免UI卡住
        commit('RESET_STATE')
        console.log('即使出错也已尝试重置状态')
        resolve()
      }
    })
  },
  
  // 更新用户权限（用于动态权限变更）
  updatePermissions({ commit, state }, { roles, perms }) {
    return new Promise((resolve) => {
      // 更新角色和权限
      commit('SET_ROLES', roles || state.roles)
      commit('SET_PERMS', perms || state.perms)
      commit('SET_LAST_UPDATE_TIME')
      resolve()
    })
  },


  async changeRoles({ commit, dispatch }, role) {
    console.log('开始切换角色:', role)
    
    // 验证角色参数
    if (!role || typeof role !== 'string') {
      throw new Error('无效的角色参数')
    }
    
    try {
      // 设置临时token（用于演示环境）
      const token = role + '-token'
      commit('SET_TOKEN', token)
      setToken(token)
      console.log('已设置新的临时令牌')

      // 获取更新后的用户信息
      const userInfo = await dispatch('getInfo')
      const { roles, perms } = userInfo || { roles: [], perms: [] }
      
      console.log('获取到更新后的用户角色和权限:', { roles, perms })

      // 重置路由
      resetRouter()
      console.log('路由已重置')

      // 基于新角色生成可访问路由
      const accessRoutes = await dispatch('permission/generateRoutes', { roles, perms })
      // 动态添加路由
      router.addRoutes(accessRoutes)
      console.log('已添加新的可访问路由')

      // 清除标签页缓存
      dispatch('tagsView/delAllViews', null, { root: true })
      console.log('标签页缓存已清除')
      
      return { success: true, roles, perms }
    } catch (error) {
      console.error('切换角色失败:', error)
      // 失败时重置令牌和状态
      await dispatch('resetToken')
      throw error
    }
  }
}

// 辅助函数：确保数据是数组格式
export function normalizeArray(data) {
  if (!data) return []
  if (Array.isArray(data)) return data
  // 如果是逗号分隔的字符串
  if (typeof data === 'string' && data.includes(',')) {
    return data.split(',').map(item => item.trim()).filter(Boolean)
  }
  // 如果是单个值，包装成数组
  return [data]
}

export default {
  namespaced: true, state, mutations, actions
}
