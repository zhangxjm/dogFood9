import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('@/components/Layout/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard/index.vue'),
        meta: { title: '仪表盘', icon: 'DataBoard' }
      },
      {
        path: 'devices',
        name: 'Devices',
        component: () => import('@/views/Device/index.vue'),
        meta: { title: '设备管理', icon: 'Monitor' }
      },
      {
        path: 'devices/:id',
        name: 'DeviceDetail',
        component: () => import('@/views/Device/DeviceDetail.vue'),
        meta: { title: '设备详情', hidden: true }
      },
      {
        path: 'monitor',
        name: 'Monitor',
        component: () => import('@/views/Monitor/index.vue'),
        meta: { title: '实时监控', icon: 'Aim' }
      },
      {
        path: 'alerts',
        name: 'Alerts',
        component: () => import('@/views/Alert/index.vue'),
        meta: { title: '故障预警', icon: 'Warning' }
      },
      {
        path: 'maintenance',
        name: 'Maintenance',
        component: () => import('@/views/Maintenance/index.vue'),
        meta: { title: '维护管理', icon: 'Tools' }
      },
      {
        path: 'spareparts',
        name: 'SpareParts',
        component: () => import('@/views/SparePart/index.vue'),
        meta: { title: '备件管理', icon: 'Box' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title || '工业设备监控平台'} - 工业设备监控平台`
  next()
})

export default router
