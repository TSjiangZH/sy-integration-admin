export default [{
  path: '/category', redirect: '/category/manage', component: () => import('@/layout/index.vue'),
    children: [{
    path: 'manage',
    component: () => import('@/views/blog/CategoryManage.vue'),
    name: 'CategoryManage',
    meta: { title: '分类管理', icon: 'list' }
  }]
}]
