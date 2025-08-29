import Layout from '@/layout'

const errorLogRoutes = [
  {
    path: '/error-log',
    component: Layout,
    redirect: '/error-log/frontend',
    name: 'ErrorLogModule',
    // 修改：将 meta.roles 改为 meta.perms
    meta: { title: '日志管理', icon: 'bug', perms: ['access:log:*'] },
    children: [
      {
        path: 'frontend',
        component: () => import('@/views/error-log/index'),
        name: 'FrontendLog',
        meta: { title: '前端日志' }
      },
      {
        path: 'backend',
        component: () => import('@/views/error-log/index'), // 可根据实际拆分
        name: 'BackendLog',
        meta: { title: '后端日志' }
      },
      {
        path: 'login',
        component: () => import('@/views/error-log/LoginLog.vue'),
        name: 'LoginLog',
        meta: { title: '登录日志' }
      }
    ]
  }
]

export default errorLogRoutes
