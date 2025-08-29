export default [
  {
    path: '/blog',
    component: () => import('@/layout'),
    redirect: '/blog/list',
    name: 'BlogModule',
    meta: { title: '博客模块', icon: 'el-icon-document' },
    children: [
      {
        path: 'list',
        component: () => import('@/views/blog/BlogList.vue'),
        name: 'BlogList',
        meta: { title: '博客管理' }
      },
      {
        path: 'edit/:id?',
        component: () => import('@/views/blog/BlogEdit.vue'),
        name: 'BlogEdit',
        meta: { title: '博客编辑' },
        hidden: true
      },
      {
        path: 'markdown',
        component: () => import('@/views/blog/BlogMarkdown.vue'),
        name: 'BlogMarkdown',
        meta: { title: '博客编写' }
      }
    ]
  }
]
