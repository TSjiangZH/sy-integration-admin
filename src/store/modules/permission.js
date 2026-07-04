// ... existing code ...
/*
import { getRoutes } from '@/api/modules/route'
*/
/**
 * ============================================
 * 【权限控制模块】前端权限状态管理
 * ============================================
 * 
 * 该模块负责管理前端权限相关的状态和操作，包括：
 * 1. 路由权限过滤：根据用户权限过滤可访问的路由
 * 2. 动态路由生成：根据角色和权限动态添加路由
 * 3. 权限状态管理：维护已生成的路由列表
 * 
 * 权限匹配策略：
 * - 精确匹配：检查用户是否有完全匹配的权限
 * - 通配符匹配：支持 '*' 超级管理员和 'module:*' 模块级权限
 * - 角色匹配：支持基于角色的访问控制
 * 
 * @author security-module
 */

import { asyncRoutes, constantRoutes } from '@/router'
// 移除未使用的导入
// import { getUserRoutes } from '@/api/modules/user'

/**
 * 判断用户是否拥有该权限
 * 
 * 权限判断逻辑：
 * 1. 如果路由没有设置权限要求（meta.permission为空），默认允许访问
 * 2. 检查用户是否为超级管理员（拥有 '*' 权限）
 * 3. 检查是否有精确匹配的权限
 * 4. 检查是否有模块级通配符权限（如 'manage:*'）
 */
const hasPermission = {
  // 判断用户是否拥有指定权限，支持通配符
  check(permissions, route) {
    if (!permissions || !route.meta || !route.meta.permissions) {
      return true
    }
    
    // 路由权限要求列表
    const routePermissions = route.meta.permissions
    
    // 检查用户是否满足路由的所有权限要求（满足任意一个即可）
    return routePermissions.some(routePerm => {
      // 精确匹配：用户权限中是否有完全匹配的权限
      if (permissions.includes(routePerm)) {
        return true
      }
      
      // 超级管理员权限 '*'
      if (permissions.includes('*')) {
        return true
      }
      
      // 模块级通配符匹配：检查用户是否有模块级权限
      return permissions.some(userPerm => {
        if (userPerm.endsWith(':*')) {
          const module = userPerm.slice(0, -2)
          return routePerm.startsWith(`${module}:`)
        }
        return false
      })
    })
  },
  
  // 过滤路由
  filterAsyncRoutes(routes, permissions) {
    const res = []
    
    // 确保路由是数组
    if (!Array.isArray(routes)) {
      console.warn('Routes parameter is not an array')
      return res
    }
    
    routes.forEach(route => {
      const tmp = { ...route }
      
      // 检查当前路由是否有权限
      if (this.check(permissions, tmp)) {
        // 处理子路由
        if (tmp.children && Array.isArray(tmp.children)) {
          const filteredChildren = this.filterAsyncRoutes(tmp.children, permissions)
          
          // 如果有子路由或当前路由有组件，则保留
          if (filteredChildren.length > 0 || tmp.component) {
            tmp.children = filteredChildren
            res.push(tmp)
          }
        } else if (tmp.component) {
          // 如果没有子路由但有组件，保留该路由
          res.push(tmp)
        }
      }
    })
    
    return res
  },
  
  // 获取用户可以访问的所有路由键值
  getAccessibleKeys(routes, permissions) {
    const keys = []
    
    if (!Array.isArray(routes)) {
      return keys
    }
    
    routes.forEach(route => {
      if (this.check(permissions, route)) {
        if (route.name) {
          keys.push(route.name)
        }
        if (route.children && Array.isArray(route.children)) {
          keys.push(...this.getAccessibleKeys(route.children, permissions))
        }
      }
    })
    return keys
  }
}

/**
 * Filter asynchronous routing tables by recursion
 * @param routes asyncRoutes
 * @param userPerms - 用户权限列表（不再使用角色）
 */
export function filterAsyncRoutes(routes = [], userPerms = []) {
  // 确保参数类型正确
  const safeRoutes = Array.isArray(routes) ? routes : []
  const permissions = Array.isArray(userPerms) ? userPerms : []
  
  // 使用增强的hasPermission对象进行路由过滤
  return hasPermission.filterAsyncRoutes(safeRoutes, permissions)
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
  // 根据用户权限生成可访问路由（仅使用权限，不再使用角色）
  generateRoutes({ commit, state }, payload) {
    // 添加参数验证
    if (!payload) {
      console.error('generateRoutes 参数错误: payload 不能为空')
      return Promise.reject('参数不能为空')
    }
    
    // 确保 perms 是数组（不再处理roles）
    const perms = Array.isArray(payload.perms) ? payload.perms : []
    
    console.log('generateRoutes接收到的权限:', { perms })

    // 如果已经尝试加载过路由，重置状态允许重新加载
    if (state.routesLoaded) {
      console.log('路由已尝试加载，将重置状态重新加载')
      commit('SET_ROUTES_LOADED', false)
    }

    return new Promise((resolve) => {
      try {
        // 标记路由开始加载
        commit('SET_ROUTES_LOADED', true)

        // 直接使用本地路由，仅使用权限过滤
        console.log('开始过滤本地路由')
        const accessedRoutes = filterAsyncRoutes(asyncRoutes, perms)
        console.log('路由过滤完成，可用路由数量:', accessedRoutes.length)
        
        // 确保添加404页面到路由末尾
        // 先检查是否已有404路由
        const has404 = accessedRoutes.some(route => route.path === '*')
        if (!has404) {
          accessedRoutes.push({
            path: '*',
            redirect: '/404',
            hidden: true
          })
        }
        
        commit('SET_ROUTES', accessedRoutes)
        resolve(accessedRoutes)
      } catch (error) {
        console.error('路由过滤过程中发生错误:', error)
        // 出错时返回空数组，避免程序崩溃
        resolve([])
      }
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
