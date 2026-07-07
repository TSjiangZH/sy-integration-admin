import Layout from '@/layout'
import { Icons } from '@/router/icons'

const errorLogRoutes = [
  {
    path: '/error-log',
    component: Layout,
    redirect: '/error-log/frontend',
    name: 'ErrorLogModule',
    // 修改：将 meta.roles 改为 meta.perms
    meta: { title: '日志管理', icon: Icons.BUG, /** 【权限控制】路由访问权限 - 使用access权限控制页面访问 */ permissions: ['access:log:*'] },
    children: [
      {
        path: 'frontend',
        component: () => import('@/views/error-log/index'),
        name: 'FrontendLog',
        meta: { title: '前端日志', /** 【权限控制】路由访问权限 - 使用access权限控制页面访问 */ permissions: ['access:log:list'] }
      },
      {
        path: 'backend',
        component: () => import('@/views/error-log/index'), // 可根据实际拆分
        name: 'BackendLog',
        meta: { title: '后端日志', /** 【权限控制】路由访问权限 - 使用access权限控制页面访问 */ permissions: ['access:log:list'] }
      },
      {
        path: 'login',
        component: () => import('@/views/error-log/LoginLog.vue'),
        name: 'LoginLog',
        meta: { title: '登录日志', /** 【权限控制】路由访问权限 - 使用access权限控制页面访问 */ permissions: ['access:log:list'] }
      },
      {
        path: 'operation',
        component: () => import('@/views/error-log/OperationLog.vue'),
        name: 'OperationLog',
        meta: { title: '操作审计', /** 【权限控制】路由访问权限 - 使用access权限控制页面访问 */ permissions: ['access:log:list'] }
      }
    ]
  }
]

export default errorLogRoutes
