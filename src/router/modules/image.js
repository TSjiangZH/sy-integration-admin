import Layout from '@/layout'

export default [{
  path: '/image', component: Layout, children: [{
    path: 'manage',
    component: () => import('@/views/image/index.vue'),
    name: 'ImageManager',
    meta: { title: '图片管理', icon: 'el-icon-picture-outline' }
  }]
}]
