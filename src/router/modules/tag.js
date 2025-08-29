export default [
  {
    path: '/tag',
    component: () => import('@/layout'),
    redirect: '/tag/manage',
    name: 'TagModule',
    meta: { title: '标签管理', icon: 'el-icon-collection-tag' },
    children: [
      {
        path: 'manage',
        component: () => import('@/views/tag/TagManage.vue'),
        name: 'TagManage',
        meta: { title: '标签管理', icon: 'el-icon-collection-tag' }
      }
    ]
  }
]
