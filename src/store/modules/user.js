import { login, logout, getInfo, refreshToken } from '@/api/modules/user'
import { getToken, setToken, removeToken, setRefreshToken, clearAuthTokens } from '@/utils/auth'
import router, { resetRouter } from '@/router'

const state = {
  token: getToken(), name: '', avatar: '', introduction: '', roles: [], perms: [], id: null
}

const mutations = {
  SET_TOKEN: (state, token) => {
    state.token = token
  }, SET_INTRODUCTION: (state, introduction) => {
    state.introduction = introduction
  }, SET_NAME: (state, name) => {
    state.name = name
  }, SET_AVATAR: (state, avatar) => {
    state.avatar = avatar
  }, SET_ROLES: (state, roles) => {
    state.roles = roles
  }, SET_PERMS: (state, perms) => {
    state.perms = perms
  }, SET_ID: (state, id) => {
    state.id = id
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
      refreshToken().then(response => {
        const { token } = response
        setToken(token)
        commit('SET_TOKEN', token)
        resolve()
      }).catch(error => {
        reject(error)
      })
    })
  },

  // get user info
  getInfo({ commit, state }) {
    return new Promise((resolve, reject) => {
      getInfo().then(response => {
        console.log('获取用户信息响应:', response)
        const { data } = response

        // 添加调试日志，查看权限数据
        console.log('用户权限数据:', data.authority)

        if (!data) {
          console.error('用户信息为空，登录失败')
          reject('Verification failed, please Login again.')
        }

        // 修正：后端返回的是role(单数)而不是roles(复数)
        const { userId, role, authority, name, avatar, remark } = data

        // roles must be a non-empty array
        let safeRoles = role
        if (!role || role.length <= 0) {
          // 自动兜底为guest角色，避免前端报错
          safeRoles = ['editor']
        }

        // 统一转小写，兼容后端大写返回
        const lowerRoles = safeRoles.map(r => r.toLowerCase())
        commit('SET_ROLES', lowerRoles)
        commit('SET_PERMS', authority || [])
        commit('SET_NAME', name)
        commit('SET_AVATAR', avatar)
        // 修正：使用remark作为introduction
        commit('SET_INTRODUCTION', remark)
        // 修正：后端返回的是userId而不是id
        commit('SET_ID', userId)
        // 返回的 data 也替换为小写后的 roles，避免后续流程出错
        resolve({ ...data, roles: lowerRoles, perms: authority || [] })
      }).catch(error => {
        reject(error)
      })
    })
  },

  // user logout
  logout({ commit, state, dispatch }) {
    return new Promise((resolve, reject) => {
      logout(state.token).then(() => {
        commit('SET_TOKEN', '')
        commit('SET_ROLES', [])
        commit('SET_PERMS', [])
        clearAuthTokens()
        resetRouter()

        // reset visited views and cached views
        // to fixed https://github.com/PanJiaChen/vue-element-admin/issues/2485
        dispatch('tagsView/delAllViews', null, { root: true })

        resolve()
      }).catch(error => {
        reject(error)
      })
    })
  },

  // remove token
  resetToken({ commit }) {
    return new Promise(resolve => {
      commit('SET_TOKEN', '')
      commit('SET_ROLES', [])
      commit('SET_PERMS', [])
      removeToken()
      resolve()
    })
  },

  // dynamically modify permissions
  async changeRoles({ commit, dispatch }, role) {
    const token = role + '-token'

    commit('SET_TOKEN', token)
    setToken(token)

    const { roles, perms } = await dispatch('getInfo')

    resetRouter()

    // generate accessible routes map based on roles
    const accessRoutes = await dispatch('permission/generateRoutes', { roles, perms })
    // dynamically add accessible routes
    router.addRoutes(accessRoutes)

    // reset visited views and cached views
    dispatch('tagsView/delAllViews', null, { root: true })
  }
}

export default {
  namespaced: true, state, mutations, actions
}
