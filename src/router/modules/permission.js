/**
 * ============================================
 * 【权限控制模块】权限管理路由配置
 * ============================================
 * 
 * 该模块定义了权限管理相关的路由，包括：
 * 1. /permission/page - 本人权限查看页面
 * 2. /permission/manage - 权限列表管理页面
 * 3. /permission/role - 角色管理页面
 * 
 * 路由权限说明：
 * - 使用 meta.permissions 定义路由访问权限
 * - 权限编码格式：module:action:resource
 * - 子路由继承父路由的权限配置
 * 
 * @author security-module
 */

import Layout from '@/layout'
import { Icons } from '@/router/icons'

const permissionRoutes = [{
  path: '/permission',
  component: Layout,
  redirect: '/permission/page',
  alwaysShow: true,
  name: 'Permission',
  meta: {
    title: '权限管理',
    icon: Icons.LOCK_SVG,
    /** 【权限控制】路由访问权限 - 使用access权限控制页面访问 */
    permissions: ['access:permission:*']
  },
  children: [
    {
      path: 'page',
      component: () => import('@/views/permission/page'),
      name: 'PagePermission',
      meta: {
        title: '本人权限',
        icon: Icons.USER_SVG,
        /** 【权限控制】路由访问权限 - 使用access权限控制页面访问 */
        permissions: ['access:permission:self']
      }
    },
    {
      path: 'manage',
      component: () => import('@/views/permission/permission-manage'),
      name: 'PermissionManage',
      meta: {
        title: '权限列表',
        icon: Icons.LIST,
        /** 【权限控制】路由访问权限 - 使用access权限控制页面访问 */
        permissions: ['access:permission:list']
      }
    },
    {
      path: 'role',
      component: () => import('@/views/permission/role/index.vue'),
      name: 'RolePermission',
      meta: {
        title: '角色管理',
        icon: Icons.PEOPLES,
        /** 【权限控制】路由访问权限 - 使用access权限控制页面访问 */
        permissions: ['access:role:*']
      }
    }
  ]
}]

export default permissionRoutes
