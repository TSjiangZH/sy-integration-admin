/**
 * ============================================
 * 【权限控制模块】前端路由配置
 * ============================================
 * 
 * 该文件定义了系统的路由结构，分为两类路由：
 * 1. constantRoutes - 公共路由，无需权限即可访问（如登录页、首页、错误页）
 * 2. asyncRoutes - 动态路由，需要根据用户角色和权限动态加载
 * 
 * 路由权限配置说明：
 * - meta.roles: 允许访问该路由的角色列表（如 ['admin', 'editor']）
 * - meta.permission: 允许访问该路由的权限编码（如 'manage:user:list'）
 * - hidden: 是否在侧边栏隐藏（true=隐藏）
 * - alwaysShow: 是否始终显示根菜单
 * 
 * 权限控制流程：
 * 路由定义 → 登录后获取用户权限 → 动态路由过滤 → 生成可访问路由 → 渲染侧边栏
 * 
 * @author security-module
 */

import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

/* Layout */
import Layout from '@/layout'

/**
 * 路由配置参数说明：
 * - hidden: true                   侧边栏不显示（默认false）
 * - alwaysShow: true               始终显示根菜单（否则子路由>1时嵌套显示）
 * - redirect: noRedirect           面包屑不重定向
 * - name:'router-name'             <keep-alive>使用，必须设置
 * - meta: {
 *     roles: ['admin','editor']    【权限控制】允许访问的角色列表
 *     title: 'title'               侧边栏和面包屑显示名称
 *     icon: 'svg-name'/'el-icon-x' 侧边栏图标
 *     noCache: true                不缓存页面（默认false）
 *     affix: true                  固定在标签页
 *     breadcrumb: false            面包屑隐藏（默认true）
 *     activeMenu: '/example/list'  高亮侧边栏路径
 *   }
 */

import { Icons } from '@/router/icons'

/**
 * constantRoutes - 公共路由
 * 无需权限即可访问，所有角色都可以访问
 */
export const constantRoutes = [
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        component: () => import('@/views/dashboard/index'),
        name: 'Dashboard',
        meta: { title: '首页', icon: Icons.DASHBOARD, affix: true }
      }
    ]
  },
  {
    path: '/redirect',
    component: Layout,
    hidden: true,
    children: [
      {
        path: '/redirect/:path(.*)',
        component: () => import('@/views/redirect/index')
      }
    ]
  },
  {
    path: '/login',
    component: () => import('@/views/login/index'),
    hidden: true
  },
  {
    path: '/auth-redirect',
    component: () => import('@/views/login/auth-redirect'),
    hidden: true
  },
  {
    path: '/404',
    component: () => import('@/views/error-page/404'),
    hidden: true
  },
  // 添加：将404路由放在constantRoutes的最后
  { path: '*', redirect: '/404', hidden: true }
]

/**
 * asyncRoutes
 * the routes that need to be dynamically loaded based on user roles
 */

import errorLogRoutes from './modules/error-log'
import userRoutes from './modules/user'
import mediaRoutes from './modules/media'
import blogRoutes from './modules/blog'
import tagRoutes from './modules/tag'
import categoryRoutes from './modules/category'
import permissionRoutes from './modules/permission'

export const asyncRoutes = [
  ...userRoutes,
  ...mediaRoutes,
  ...blogRoutes,
  ...tagRoutes,
  ...categoryRoutes,
  ...permissionRoutes,
  ...errorLogRoutes,

  // 删除：从asyncRoutes中移除404路由
  // { path: '*', redirect: '/404', hidden: true }
]

const createRouter = () => new Router({
  // mode: 'history', // require service support - 当前已注释，使用hash模式
  scrollBehavior: () => ({ y: 0 }),
  // 只包含constantRoutes，asyncRoutes将在permission.js中根据用户权限动态添加
  routes: constantRoutes
})

const router = createRouter()

// Detail see: https://github.com/vuejs/vue-router/issues/1234#issuecomment-357941465
export function resetRouter() {
  const newRouter = createRouter()
  router.matcher = newRouter.matcher // reset router
}

export default router
