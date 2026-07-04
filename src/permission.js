/**
 * ============================================
 * 【权限控制模块】前端路由权限守卫
 * ============================================
 * 
 * 该文件是前端权限控制的核心入口，负责在路由导航前进行权限检查
 * 通过Vue Router的beforeEach守卫实现路由级别的权限控制
 * 
 * 主要功能：
 * 1. 检查用户是否已登录（通过token判断）
 * 2. 获取用户角色和权限信息
 * 3. 根据角色和权限动态生成可访问路由
 * 4. 验证路由访问权限（支持角色和权限两种方式）
 * 5. 处理未登录、无权限等异常情况
 * 
 * 权限控制流程：
 * 路由导航 → 检查登录状态 → 获取用户权限 → 动态生成路由 → 权限校验 → 导航放行/拦截
 * 
 * @author security-module
 */

import router from './router'
import store from './store'
import NProgress from 'nprogress' // progress bar
import 'nprogress/nprogress.css' // progress bar style
import { Message } from 'element-ui'
import { getToken } from '@/utils/auth' // get token from cookie
import getPageTitle from '@/utils/get-page-title'

NProgress.configure({ showSpinner: false }) // NProgress Configuration

/**
 * 路由白名单
 * 这些路径无需登录即可访问
 */
const whiteList = ['/login', '/auth-redirect', '/404', '/401']

/**
 * 路由访问权限检查
 * 
 * 仅支持功能权限（permissions）控制：基于细粒度功能权限进行访问控制
 * 
 * 权限匹配规则：
 * - 精确匹配：用户权限与路由要求的权限完全一致
 * - 通配符匹配：支持 '*'（超级管理员）和 'module:*'（模块级权限）
 * 
 * @param {Route} to - 目标路由
 * @returns {boolean} - 是否有权限访问
 */
function checkRouteAccess(to) {
  // 从store获取权限
  const permissions = store.getters.perms || []
  
  // 白名单路由直接允许访问
  if (whiteList.includes(to.path)) {
    return true
  }
  
  // 如果路由没有设置权限控制（meta.permissions为空），默认为允许访问
  if (!to.meta || !to.meta.permissions || !Array.isArray(to.meta.permissions)) {
    return true
  }
  
  // 路由权限要求列表
  const routePermissions = to.meta.permissions
  
  // 检查用户是否满足路由的权限要求（满足任意一个即可）
  const hasAccess = routePermissions.some(routePerm => {
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
      if (userPerm && userPerm.endsWith(':*')) {
        const module = userPerm.slice(0, -2)
        return routePerm && routePerm.startsWith(`${module}:`)
      }
      return false
    })
  })
  
  if (!hasAccess) {
    console.warn(`用户 ${store.getters.name || '未知'} 无权限访问 ${to.path}`)
  }
  
  return hasAccess
}

/**
 * 处理路由异常的通用函数
 */
async function handleRouteError(error, to, next) {
  console.error('路由异常:', error)
  try {
    // 移除 token 并重定向到登录页面
    // 注意：由于request.js中已经有清除token的逻辑，这里只需要清除store中的状态
    await store.dispatch('user/resetToken')
  } catch (resetError) {
    console.error('重置token失败:', resetError)
  }
  
  // 只显示错误消息，不执行next重定向
  // 因为request.js已经会处理重定向逻辑，避免多重定向
  Message.error(error.message || '登录信息已过期，请重新登录')
  NProgress.done()
  
  // 避免路由无限循环
  if (to.path !== '/login') {
    next({ path: '/login', replace: true })
  }
}

/**
 * 清除路由加载状态，允许重新获取路由
 */
function resetRouteState() {
  try {
    // 重置路由加载状态
    store.commit('permission/SET_ROUTES_LOADED', false)
  } catch (error) {
    console.error('重置路由状态失败:', error)
  }
}

// 路由守卫
router.beforeEach(async (to, from, next) => {
  // start progress bar
  NProgress.start()

  // 设置页面标题
  document.title = getPageTitle(to.meta.title)

  try {
    // 判断用户是否已登录（有token）
    const hasToken = getToken()

    if (hasToken) {
      if (to.path === '/login') {
        // 如果已登录且要访问登录页，重定向到首页
        next({ path: '/' })
        NProgress.done()
      } else {
        // 确定用户是否已获取其权限角色信息
        const userRoles = store.getters.roles || []
        const hasRoles = Array.isArray(userRoles) && userRoles.length > 0
        
        if (hasRoles) {
          // 使用增强的权限检查方法验证路由访问权限
          const hasAccess = checkRouteAccess(to)
          
          if (hasAccess) {
            next()
          } else {
            // 无权限重定向到401页面
            next({ path: '/401', replace: true, query: { noGoBack: true } })
          }
        } else {
          // 尝试获取用户信息
          try {
            console.log('尝试获取用户信息...')
            // 获取用户信息
            const userInfoResult = await store.dispatch('user/getInfo')
            
            // 确保返回的数据包含roles和perms
            const { roles = [], perms = [] } = userInfoResult || {} 
            
            console.log('用户信息获取成功，准备生成路由')
            
            // 验证角色和权限数据格式
            if (!Array.isArray(roles) || !Array.isArray(perms)) {
              throw new Error('用户角色或权限数据格式错误')
            }
            
            // 基于角色和权限生成可访问的路由映射
            const accessRoutes = await store.dispatch('permission/generateRoutes', { 
              roles: roles, 
              perms: perms 
            })
            
            console.log('路由生成成功，正在添加动态路由')
            
            // 动态添加可访问路由
            // 注意：vue-router 3.x版本使用addRoutes方法(复数)而非addRoute
            router.addRoutes(accessRoutes)
            
            console.log('动态路由添加完成')
            
            // hack 方法，确保 addRoutes 已完成，set the replace: true, 这样导航将不会留下历史记录
            next({ ...to, replace: true })
          } catch (userInfoError) {
            console.error('获取用户信息或生成路由时出错:', userInfoError)
            
            // 检查错误是否来自401未授权
            const is401Error = userInfoError.message && 
                              (userInfoError.message.includes('401') || 
                               userInfoError.message.includes('未授权'))
            
            // 如果是401错误，重置路由状态但不执行handleRouteError
            // 因为request.js已经会处理401并执行跳转
            if (is401Error) {
              console.warn('检测到401错误，由request.js处理重定向')
              resetRouteState()
              NProgress.done()
              return
            }
            
            // 重置路由状态，以便下次可以重新尝试
            resetRouteState()
            // 处理其他类型的路由错误
            await handleRouteError(userInfoError, to, next)
          }
        }
      }
    } else {
      // 没有 token
      if (whiteList.includes(to.path)) {
        // 在免登录白名单中，直接进入
        next()
      } else {
        // 否则重定向到登录页，并带上目标路径作为重定向参数
        const loginRedirect = `/login?redirect=${encodeURIComponent(to.path)}`
        console.log(`未登录用户访问受限页面，重定向到: ${loginRedirect}`)
        next(loginRedirect)
        NProgress.done()
      }
    }
  } catch (error) {
    // 捕获所有未处理的异常
    console.error('路由守卫处理异常:', error)
    Message.error('系统异常，请重试')
    NProgress.done()
    
    // 防止路由死循环，将导航重定向到错误页面而非简单地取消
    if (to.path !== '/404') {
      next({ path: '/404', replace: true })
    } else {
      next(false) // 如果已经在404页面，则取消导航
    }
  }
})

router.afterEach(() => {
  // finish progress bar
  NProgress.done()
})

// 路由错误处理
router.onError((error) => {
  NProgress.done()
  console.error(`[路由错误]: ${error}`)
  
  // 检查错误类型，针对不同错误给出不同提示
  let errorMessage = '页面加载失败，请刷新页面重试'
  
  if (error.message && error.message.includes('Failed to fetch dynamically imported module')) {
    errorMessage = '页面组件加载失败，请检查网络连接'
  } else if (error.message && error.message.includes('Cannot read property')) {
    errorMessage = '页面数据解析错误，请联系管理员'
  }
  
  Message.error(errorMessage)
})
