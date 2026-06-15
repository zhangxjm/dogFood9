import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '仪表盘', icon: 'Odometer' }
      },
      {
        path: 'transactions',
        name: 'Transactions',
        component: () => import('@/views/Transactions.vue'),
        meta: { title: '交易管理', icon: 'List' }
      },
      {
        path: 'alerts',
        name: 'Alerts',
        component: () => import('@/views/Alerts.vue'),
        meta: { title: '风险预警', icon: 'Warning' }
      },
      {
        path: 'cases',
        name: 'Cases',
        component: () => import('@/views/Cases.vue'),
        meta: { title: '案例分析', icon: 'Document' }
      },
      {
        path: 'rules',
        name: 'Rules',
        component: () => import('@/views/Rules.vue'),
        meta: { title: '规则管理', icon: 'Setting' }
      },
      {
        path: 'ml-model',
        name: 'MLModel',
        component: () => import('@/views/MLModel.vue'),
        meta: { title: '模型管理', icon: 'Cpu' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title 
    ? `${to.meta.title} - 风控管理后台` 
    : '风控管理后台 - 欺诈交易检测系统'
  next()
})

export default router
