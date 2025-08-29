// ... existing code ...
/*
import { getRoutes } from '@/api/modules/route'
*/
import { asyncRoutes, constantRoutes } from '@/router'
// 移除未使用的导入
// import { getUserRoutes } from '@/api/modules/user'

/**
 * Use meta.role to determine if the current user has permission
 * @param userRoles
 * @param userPerms
 * @param route
 */
function hasPermission(userRoles, userPerms, route) {
  if (route.meta) {
    // 检查角色权限
    if (route.meta.roles && !route.meta.roles.some(r => userRoles.includes(r))) {
      return false
    }

    // 检查权限，并支持通配符匹配
    if (route.meta.perms) {
      const hasAnyPerm = route.meta.perms.some(perm => {
        // 1. 精确匹配
        if (userPerms.includes(perm)) {
          return true
        }

        // 2. 通配符匹配（例如 access:user 匹配 access:user:*）
        // 检查用户是否有包含当前权限的更高级权限
        return userPerms.some(userPerm => {
          // 例如：如果用户有权限 access:user，那么匹配 access:user:*
          if (perm.endsWith(':*') && userPerm === perm.slice(0, -2)) {
            return true
          }
          // 例如：如果用户有权限 access:*,那么匹配所有 access:开头的权限
          if (userPerm.endsWith(':*') && perm.startsWith(userPerm.slice(0, -1))) {
            return true
          }
          return false
        })
      })

      if (!hasAnyPerm) {
        return false
      }
    }
  }
  return true
}

/**
 * Filter asynchronous routing tables by recursion
 * @param routes asyncRoutes
 * @param userRoles
 * @param userPerms
 */
export function filterAsyncRoutes(routes, userRoles, userPerms) {
  const res = []
  routes.forEach(route => {
    const tmp = { ...route }
    if (hasPermission(userRoles, userPerms, tmp)) {
      if (tmp.children) {
        tmp.children = filterAsyncRoutes(tmp.children, userRoles, userPerms)
      }
      res.push(tmp)
    }
  })
  return res
}

const state = {
  routes: [],
  addRoutes: [],
  // 添加一个标志来跟踪路由是否已尝试加载
  routesLoaded: false
}

const mutations = {
  SET_ROUTES: (state, routes) => {
    state.addRoutes = routes
    state.routes = constantRoutes.concat(routes)
  },
  SET_ROUTES_LOADED: (state, loaded) => {
    state.routesLoaded = loaded
  }
}

const actions = {
  // 根据用户角色和权限生成可访问路由
  generateRoutes({ commit, state }, payload) {
    // 添加参数验证
    if (!payload || !payload.roles) {
      // console.error('generateRoutes 参数错误:', payload);
      return Promise.reject(' roles 参数不能为空')
    }
    const { roles, perms = [] } = payload

    // 如果已经尝试加载过路由，直接resolve空数组，避免重复请求
    if (state.routesLoaded) {
      // console.log('路由已尝试加载，避免重复请求');
      return Promise.resolve([])
    }

    return new Promise((resolve) => {
      // 标记路由开始加载
      commit('SET_ROUTES_LOADED', true)

      // 从后端获取路由
      // 暂时注释掉后端路由获取，后期会开发由后端控制路由的业务
      /* getUserRoutes().then(response => {
        console.log('获取后端路由响应:', response)
        const data = response.data
        console.log('后端路由数据:', data)
        // 对data进行处理
        if (data && data.length > 0) {
          // 格式化后端返回的路由数据
          const formattedRoutes = formatAsyncRoutes(data)
          // 使用用户角色和权限过滤路由
          const accessedRoutes = filterAsyncRoutes(formattedRoutes, roles, perms)
          commit('SET_ROUTES', accessedRoutes)
          resolve(accessedRoutes)
        } else {
          // 如果后端没有返回路由或返回空数组，则使用本地路由
          const accessedRoutes = filterAsyncRoutes(asyncRoutes, roles, perms)
          commit('SET_ROUTES', accessedRoutes)
          resolve(accessedRoutes)
        }
 */

      // 直接使用本地路由
      const accessedRoutes = filterAsyncRoutes(asyncRoutes, roles, perms)
      commit('SET_ROUTES', accessedRoutes)
      resolve(accessedRoutes)
    })
  }
}

// 移除未使用的函数
// 递归格式化后端路由为vue-router路由
// function formatAsyncRoutes(routes) {
//   return routes.map(route => {
//     const r = {
//       path: route.path,
//       name: route.name,
//       component: loadView(route.component),
//       meta: route.meta || {},
//       hidden: route.hidden || false
//     }

//     // 处理重定向
//     if (route.redirect) {
//       r.redirect = route.redirect
//     }

//     // 处理alwaysShow
//     if (route.alwaysShow !== undefined) {
//       r.alwaysShow = route.alwaysShow
//     }

//     // 处理子路由
//     if (route.children && route.children.length) {
//       r.children = formatAsyncRoutes(route.children)
//     }

//     return r
//   })
// }

// 移除未使用的函数
// function loadView(view) {
//   // 支持 Layout 特殊写法
//   // if (view === 'Layout' || view === '@/layout' || view === '/layout' || view === 'layout') {
//   //   return require('@/layout').default
//   // }

//   // 处理组件路径
//   // if (view.startsWith('@/')) {
//   //   view = view.substring(2)
//   // }

//   // 动态导入组件
//   // return () => import(`@/views/${view}`)
// }

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
