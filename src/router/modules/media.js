import Layout from '@/layout'
import { Icons } from '@/router/icons'

const mediaRoutes =  [
  {
    path: '/media',
    component: Layout, 
    alwaysShow: true,
    redirect: '/media/image',
    name: 'MediaManager',
    meta: { 
      title: '图片管理', 
      icon: Icons.IMAGE,
      /** 【权限控制】路由访问权限 - 使用access权限控制页面访问 */
      permissions: ['access:image:*']
    },
    children: [
      {
        path: 'image',
        component: () => import('@/views/media/image/index.vue'),
        name: 'ImageManager',
        meta: { 
          title: '图片管理', 
          icon: Icons.IMAGE,
          /** 【权限控制】路由访问权限 - 使用access权限控制页面访问 */
          permissions: ['access:image:list']
        }
      }
    ]
  }
]
export default mediaRoutes
