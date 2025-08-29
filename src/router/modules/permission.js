import Layout from '@/layout'

const permissionRoutes = [{
  path: '/permission', component: Layout, redirect: '/permission/page', alwaysShow: true, name: 'Permission', meta: {
    title: '权限管理', icon: 'lock', roles: ['admin']
  }, children: [{
    path: 'page', component: () => import('@/views/permission/page'), name: 'PagePermission', meta: {
      title: '本人权限', icon: 'user', roles: ['admin']
    }
  }, {
    path: 'manage', component: () => import('@/views/permission/permission-manage'), name: 'PermissionManage', meta: {
      title: '权限列表', icon: 'list', roles: ['admin']
    }
  }, {
    path: 'role', component: () => import('@/views/permission/role'), name: 'RolePermission', meta: {
      title: '角色权限', icon: 'user', roles: ['admin']
    }
  }]
}]

export default permissionRoutes
