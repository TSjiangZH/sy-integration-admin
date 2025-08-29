import Layout from '@/layout'

const roleRoutes = [
  {
    path: '/role',
    component: Layout,
    redirect: '/role/manage',
    name: 'Role',
    // 修改：将 meta.roles 改为 meta.perms
    meta: { title: '角色管理', icon: 'el-icon-s-custom', perms: ['access:role:*'] },
    children: [
      {
        path: 'manage',
        component: () => import('@/views/role/index.vue'),
        name: 'RoleList',
        meta: { title: '角色列表', icon: 'el-icon-s-custom' }
      }
    ]
  }
]

export default roleRoutes
