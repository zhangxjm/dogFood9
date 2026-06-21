import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAlertStore = defineStore('alert', () => {
  const alertList = ref([])
  const unhandledCount = ref(0)
  const loading = ref(false)

  const criticalCount = computed(() => 
    alertList.value.filter(a => a.level === 'critical' && a.status === 'pending').length
  )

  const warningCount = computed(() => 
    alertList.value.filter(a => a.level === 'warning' && a.status === 'pending').length
  )

  const infoCount = computed(() => 
    alertList.value.filter(a => a.level === 'info' && a.status === 'pending').length
  )

  function setAlertList(list) {
    alertList.value = list
  }

  function setUnhandledCount(count) {
    unhandledCount.value = count
  }

  function addAlert(alert) {
    alertList.value.unshift(alert)
    if (alert.status === 'pending') {
      unhandledCount.value++
    }
  }

  function setLoading(val) {
    loading.value = val
  }

  return {
    alertList,
    unhandledCount,
    loading,
    criticalCount,
    warningCount,
    infoCount,
    setAlertList,
    setUnhandledCount,
    addAlert,
    setLoading
  }
})
