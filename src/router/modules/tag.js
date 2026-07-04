import { Icons } from '@/router/icons'

const tagRoutes = [
  {
    path: '/tag',
    component: () => import('@/layout/index.vue'),
    redirect: '/tag/manage',
    name: 'Tag',
    meta: { 
      title: '标签管理', 
      icon: Icons.TAGS,
      /** 【权限控制】路由访问权限 - 使用access权限控制页面访问 */
      permissions: ['access:tag:*']
    },
    children: [
      {
        path: 'manage',
        component: () => import('@/views/tag/TagManage.vue'),
        name: 'TagManage',
        meta: { 
          title: '标签管理', 
          icon: Icons.TAGS,
          /** 【权限控制】路由访问权限 - 使用access权限控制页面访问 */
          permissions: ['access:tag:list']
        }
      }
    ]
  }
]
export default tagRoutes