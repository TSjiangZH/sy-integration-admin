import Layout from '@/layout'

const userRoutes = [
  {
    path: '/user',
    component: Layout,
    redirect: '/user/manage',
    name: 'User',
    meta: {
      title: '用户管理',
      icon: 'el-icon-user-solid',
      // 修改为正确的权限标识
      perms: ['manage:user:*']
    },
    children: [
      {
        path: 'manage',
        component: () => import('@/views/user/index.vue'),
        name: 'UserList',
        meta: {
          title: '用户列表',
          icon: 'el-icon-user',
          // 修改为正确的权限标识
          perms: ['access:user:*']
        }
      }
    ]
  }
]

export default userRoutes
