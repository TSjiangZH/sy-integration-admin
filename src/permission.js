import router from './router'
import store from './store'
import { Message } from 'element-ui'
import NProgress from 'nprogress' // progress bar
import 'nprogress/nprogress.css' // progress bar style
import { getToken } from '@/utils/auth' // get token from cookie
import getPageTitle from '@/utils/get-page-title'
import { handleError, ErrorType, AppError } from '@/utils/error-handler'

NProgress.configure({ showSpinner: false }) // NProgress Configuration

const whiteList = ['/login', '/auth-redirect'] // no redirect whitelist

router.beforeEach(async(to, from, next) => {
  // start progress bar
  NProgress.start()

  // set page title
  document.title = getPageTitle(to.meta.title)

  // determine whether the user has logged in
  const hasToken = getToken()

  if (hasToken) {
    if (to.path === '/login') {
      // if is logged in, redirect to the home page
      next({ path: '/' })
      NProgress.done()
    } else {
      // determine whether the user has obtained his permission roles through getInfo
      const hasRoles = store.getters.roles && store.getters.roles.length > 0
      if (hasRoles) {
        // 优化：只在未添加动态路由时addRoutes，添加后直接next，避免死循环
        const hasAddRoutes = store.getters.addRoutes && store.getters.addRoutes.length > 0
        if (hasAddRoutes) {
          // 添加调试日志
          // console.log('用户角色:', store.getters.roles)
          // console.log('已添加的路由:', store.getters.addRoutes)
          next()
        } else {
          try {
            // 修复：传递roles和perms参数
            const accessRoutes = await store.dispatch('permission/generateRoutes', {
              roles: store.getters.roles, perms: store.getters.perms || []
            })
            router.addRoutes(accessRoutes)
            // 直接跳转，确保路由已完全注册
            next({ ...to, replace: true })
          } catch (error) {
            // console.error('重新生成路由失败:', error)
            // 修复：添加错误处理后的next()调用，避免死循环
            await store.dispatch('user/resetToken')
            Message.error('路由加载失败，请重新登录')
            next(`/login?redirect=${to.path}`)
            NProgress.done()
          }
        }
      } else {
        try {
          // get user info
          const { roles, perms } = await store.dispatch('user/getInfo')

          // 添加调试日志
          // console.log('获取用户角色:', roles)
          // console.log('获取用户权限:', perms)

          // generate accessible routes map based on roles
          // 在生成路由后添加日志
          const accessRoutes = await store.dispatch('permission/generateRoutes', { roles, perms })
          // console.log('生成的可访问路由:', accessRoutes)

          // 检查是否包含role相关路由
          // const hasRoleRoute = accessRoutes.some(route => route.path === '/role')
          // console.log('是否包含角色管理路由:', hasRoleRoute)

          // dynamically add accessible routes
          router.addRoutes(accessRoutes)

          // hack method to ensure that addRoutes is complete
          // set the replace: true, so the navigation will not leave a history record
          next({ ...to, replace: true })
        } catch (error) {
          // remove token and go to login page to re-login
          await store.dispatch('user/resetToken')

          // 使用统一的错误处理
          const appError = new AppError(ErrorType.AUTH, '获取用户信息失败，请重新登录', error, 'HIGH', 'Route Guard - User Info Error')
          handleError(appError, `路由守卫错误 - 路径: ${to.path}`)

          Message.error('获取用户信息失败，请重新登录')
          next(`/login?redirect=${to.path}`)
          NProgress.done()
        }
      }
    }
  } else {
    /* has no token*/

    if (whiteList.indexOf(to.path) !== -1) {
      // in the free login whitelist, go directly
      next()
    } else {
      // other pages that do not have permission to access are redirected to the login page.
      next(`/login?redirect=${to.path}`)
      NProgress.done()
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

  // 使用统一的错误处理
  const appError = new AppError(ErrorType.ROUTE, '路由加载失败', error, 'MEDIUM', 'Router Error')
  handleError(appError, '路由错误处理')
})
