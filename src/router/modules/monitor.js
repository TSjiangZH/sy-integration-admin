import Layout from '@/layout'
import { Icons } from '@/router/icons'

const monitorRoutes = [
  {
    path: '/monitor',
    component: Layout,
    redirect: '/monitor/cpu',
    name: 'Monitor',
    meta: { title: '系统监测', icon: Icons.DATA_ANALYSIS, permissions: ['access:monitor:*'] },
    children: [
      {
        path: 'cpu',
        component: () => import('@/views/monitor/cpu'),
        name: 'CpuMonitor',
        meta: { title: 'CPU监测', permissions: ['access:monitor:cpu'] }
      },
      {
        path: 'memory',
        component: () => import('@/views/monitor/memory'),
        name: 'MemoryMonitor',
        meta: { title: '内存监测', permissions: ['access:monitor:memory'] }
      },
      {
        path: 'disk',
        component: () => import('@/views/monitor/disk'),
        name: 'DiskMonitor',
        meta: { title: '磁盘监测', permissions: ['access:monitor:disk'] }
      },
      {
        path: 'network',
        component: () => import('@/views/monitor/network'),
        name: 'NetworkMonitor',
        meta: { title: '网络监测', permissions: ['access:monitor:network'] }
      },
      {
        path: 'system',
        component: () => import('@/views/monitor/system'),
        name: 'SystemMonitor',
        meta: { title: '系统信息', permissions: ['access:monitor:system'] }
      }
    ]
  }
]

export default monitorRoutes