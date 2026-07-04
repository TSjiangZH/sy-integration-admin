import Layout from '@/layout'
import { Icons } from '@/router/icons'

const userRoutes = [
  {
    path: '/user',
    component: Layout,
    redirect: '/user/manage',
    name: 'User',
    meta: {
      title: '用户管理',
      icon: Icons.USER_SOLID,
      /** 【权限控制】路由访问权限 - 使用access权限控制页面访问 */
      permissions: ['access:user:*']
    },
    children: [
      {
        path: 'manage',
        component: () => import('@/views/user/index.vue'),
        name: 'UserList',
        meta: {
          title: '用户列表',
          icon: Icons.USER,
          /** 【权限控制】路由访问权限 - 使用access权限控制页面访问 */
          permissions: ['access:user:list']
        }
      }
    ]
  }
]

export default userRoutes
