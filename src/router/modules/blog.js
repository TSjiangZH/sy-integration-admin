import { Icons } from '@/router/icons'

const blogRoutes = [
  {
    path: '/blog',
    component: () => import('@/layout'),
    redirect: '/blog/list',
    name: 'BlogModule',
    meta: { 
      title: '博客模块', 
      icon: Icons.DOCUMENT,
      /** 【权限控制】路由访问权限 - 使用access权限控制页面访问 */
      permissions: ['access:blog:*']
    },
    children: [
      {
        path: 'list',
        component: () => import('@/views/blog/BlogList.vue'),
        name: 'BlogList',
        meta: { 
          title: '博客管理',
          /** 【权限控制】路由访问权限 - 使用access权限控制页面访问 */
          permissions: ['access:blog:list']
        }
      },
      {
        path: 'draft',
        component: () => import('@/views/blog/BlogDraft.vue'),
        name: 'BlogDraft',
        meta: { 
          title: '草稿管理',
          /** 【权限控制】路由访问权限 - 使用access权限控制页面访问 */
          permissions: ['access:blog:list']
        }
      },
      {
        path: 'review',
        component: () => import('@/views/blog/BlogReview.vue'),
        name: 'BlogReview',
        meta: { 
          title: '博客审核',
          /** 【权限控制】路由访问权限 - 使用access权限控制页面访问 */
          permissions: ['access:blog:review']
        }
      },
      {
        path: 'approved',
        component: () => import('@/views/blog/BlogApproved.vue'),
        name: 'BlogApproved',
        meta: { 
          title: '已发布博客',
          /** 【权限控制】路由访问权限 - 使用access权限控制页面访问 */
          permissions: ['access:blog:list']
        }
      },
      {
        path: 'deleted',
        component: () => import('@/views/blog/BlogDelList.vue'),
        name: 'BlogDelList',
        meta: { 
          title: '已删除博客',
          /** 【权限控制】路由访问权限 - 使用access权限控制页面访问 */
          permissions: ['access:blog:delete']
        }
      },
      {
        path: 'edit/:id?',
        component: () => import('@/views/blog/BlogEdit.vue'),
        name: 'BlogEdit',
        meta: { 
          title: '博客编辑',
          /** 【权限控制】路由访问权限 - 使用access权限控制页面访问 */
          permissions: ['access:blog:update']
        },
        hidden: true
      },
      {
        path: 'view/:id',
        component: () => import('@/views/blog/BlogView.vue'),
        name: 'BlogView',
        meta: { 
          title: '查看博客',
          /** 【权限控制】路由访问权限 - 使用access权限控制页面访问 */
          permissions: ['access:blog:list']
        },
        hidden: true
      },
      {
        path: 'markdown',
        component: () => import('@/views/blog/BlogMarkdown.vue'),
        name: 'BlogMarkdown',
        meta: { 
          title: '博客编写',
          /** 【权限控制】路由访问权限 - 使用access权限控制页面访问 */
          permissions: ['access:blog:create']
        }
      }
    ]
  }
]

export default blogRoutes
