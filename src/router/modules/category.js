import { Icons } from '@/router/icons'

const categoryRoutes = [{
  path: '/category', 
  redirect: '/category/manage', 
  component: () => import('@/layout/index.vue'),
  meta: { 
    title: '分类管理', 
    icon: Icons.LIST,
    /** 【权限控制】路由访问权限 - 使用access权限控制页面访问 */
    permissions: ['access:category:*']
  },
  children: [{
    path: 'manage',
    component: () => import('@/views/blog/CategoryManage.vue'),
    name: 'CategoryManage',
    meta: { 
      title: '分类管理', 
      icon: Icons.LIST,
      /** 【权限控制】路由访问权限 - 使用access权限控制页面访问 */
      permissions: ['access:category:list']
    }
  }]
}]
export default categoryRoutes
